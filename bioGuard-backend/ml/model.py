"""
BioGuard Wildlife Risk ML Model — v2
============================================================
Dual-mode script:
  CLI mode   : python model.py --train | --predict [args]
  Server mode: python model.py --serve   (Flask HTTP API on :5001)

REST endpoints (server mode):
  POST /predict  body: { lat, lng, dist_forest, sightings,
                         time_hr, hist_conflicts }
  GET  /health
  POST /train    (retrain on demand)
"""

import os
import sys
import json
import argparse
import pickle
import threading

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

# ─── Paths ────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')

# ═══════════════════════════════════════════════════════════
#  DATA  — synthetic NE India conservation dataset
# ═══════════════════════════════════════════════════════════
def generate_synthetic_data(num_samples: int = 3000) -> pd.DataFrame:
    """
    Generates realistic NE India conservation data.
    Lat/Lng ranges: 22–29.5 N, 88–97.5 E
    """
    np.random.seed(42)
    lats = np.random.uniform(22.0, 29.5, num_samples)
    lngs = np.random.uniform(88.0, 97.5, num_samples)

    # Distance to nearest forest zone (km)  — skewed toward <50km
    dist_forest = np.abs(np.random.normal(15, 30, num_samples))

    # Wildlife sightings count (0–100), inversely correlated with distance
    sightings = np.maximum(
        0,
        np.round(100 - dist_forest * 2 + np.random.normal(0, 10, num_samples))
    )

    # Hour of day (0‑23); night = higher risk
    time_hr   = np.random.randint(0, 24, num_samples)
    time_risk = np.where((time_hr >= 18) | (time_hr <= 5), 1.0, 0.0)

    # Historical conflict count (0–50)
    hist_conflicts = np.maximum(
        0,
        np.round(sightings * 0.3 + np.random.normal(0, 5, num_samples))
    )

    # ── Risk score (0–1) ──────────────────────────────────
    # Closer to forest  → higher risk (+40%)
    # More sightings    → higher risk (+30%)
    # Night time        → higher risk (+15%)
    # High past conflicts→ higher risk (+15%)
    raw_risk = (
        (50 - np.minimum(dist_forest, 50)) / 50 * 0.40 +
        np.minimum(sightings, 50)           / 50 * 0.30 +
        time_risk                                * 0.15 +
        np.minimum(hist_conflicts, 20)      / 20 * 0.15
    )
    raw_risk += np.random.normal(0, 0.05, num_samples)   # noise
    risk_score = np.clip(raw_risk, 0.0, 1.0)

    return pd.DataFrame({
        'lat':           lats,
        'lng':           lngs,
        'dist_forest':   dist_forest,
        'sightings':     sightings,
        'time_hr':       time_hr,
        'hist_conflicts':hist_conflicts,
        'risk_score':    risk_score,
    })


# ═══════════════════════════════════════════════════════════
#  TRAIN
# ═══════════════════════════════════════════════════════════
_train_lock = threading.Lock()

def train(silent: bool = False) -> dict:
    """Train the Random Forest Regressor and save to disk."""
    with _train_lock:
        if not silent:
            print("[ML] Generating dataset…")
        df = generate_synthetic_data(3000)

        X = df[['lat', 'lng', 'dist_forest', 'sightings', 'time_hr', 'hist_conflicts']]
        y = df['risk_score']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        if not silent:
            print("[ML] Training RandomForestRegressor (100 trees)…")
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)

        score = model.score(X_test, y_test)
        if not silent:
            print(f"[ML] R² Score: {score:.4f}")

        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(model, f)
        if not silent:
            print(f"[ML] Model saved → {MODEL_PATH}")

        return { "status": "trained", "r2_score": round(score, 4), "samples": len(df) }


# ═══════════════════════════════════════════════════════════
#  PREDICT  (core logic, shared by CLI + server)
# ═══════════════════════════════════════════════════════════
_model_cache = None
_model_lock  = threading.Lock()

def _load_model():
    """Load model from disk (cached)."""
    global _model_cache
    if _model_cache is not None:
        return _model_cache
    with _model_lock:
        if _model_cache is not None:
            return _model_cache
        if not os.path.exists(MODEL_PATH):
            # Auto-train on first request
            train(silent=True)
        with open(MODEL_PATH, 'rb') as f:
            _model_cache = pickle.load(f)
    return _model_cache


def _risk_level(score: float) -> str:
    if score >= 0.70:
        return "Critical"
    if score >= 0.45:
        return "High"
    if score >= 0.25:
        return "Medium"
    return "Low"


def predict(lat, lng, dist_forest, sightings, time_hr, hist_conflicts) -> dict:
    """
    Run a single prediction and return a structured dict.
    All inputs are coerced to float.
    """
    model = _load_model()

    features = pd.DataFrame([{
        'lat':           float(lat),
        'lng':           float(lng),
        'dist_forest':   float(dist_forest),
        'sightings':     float(sightings),
        'time_hr':       float(time_hr),
        'hist_conflicts':float(hist_conflicts),
    }])

    raw_score  = model.predict(features)[0]
    pred_score = float(np.clip(raw_score, 0.0, 1.0))

    return {
        "risk_score":   round(pred_score, 4),
        "risk_level":   _risk_level(pred_score),
        "confidence":   round(min(0.97, 0.60 + pred_score * 0.35), 2),
        "model":        "RandomForestRegressor (sklearn)",
        "features_used": {
            "lat": float(lat), "lng": float(lng),
            "dist_forest":    float(dist_forest),
            "sightings":      float(sightings),
            "time_hr":        float(time_hr),
            "hist_conflicts": float(hist_conflicts),
        },
    }


# ═══════════════════════════════════════════════════════════
#  FLASK SERVER  (--serve mode)
# ═══════════════════════════════════════════════════════════
def run_server(port: int = 5001):
    try:
        from flask import Flask, request, jsonify
        from flask_cors import CORS
    except ImportError:
        print("[ML] Flask not found — installing via pip…", flush=True)
        import subprocess
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'flask', 'flask-cors', '-q'])
        from flask import Flask, request, jsonify
        from flask_cors import CORS

    app = Flask(__name__)
    CORS(app)

    # ── Pre-load model at startup ──────────────────────────
    _load_model()
    print(f"[ML] 🐍 Flask prediction server ready on port {port}", flush=True)

    @app.route('/health', methods=['GET'])
    def health():
        return jsonify({
            "status":    "ok",
            "model":     "RandomForestRegressor",
            "model_path": MODEL_PATH,
            "loaded":    _model_cache is not None,
        })

    @app.route('/predict', methods=['POST'])
    def predict_route():
        body = request.get_json(force=True, silent=True) or {}
        required = ['lat', 'lng', 'dist_forest', 'sightings', 'time_hr', 'hist_conflicts']
        missing  = [k for k in required if k not in body]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400
        try:
            result = predict(
                body['lat'], body['lng'],
                body['dist_forest'], body['sightings'],
                body['time_hr'],     body['hist_conflicts'],
            )
            return jsonify(result)
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    @app.route('/train', methods=['POST'])
    def train_route():
        try:
            # Invalidate model cache so next predict loads the new model
            global _model_cache
            _model_cache = None
            result = train(silent=True)
            _load_model()   # pre-warm
            return jsonify(result)
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    app.run(host='0.0.0.0', port=port, debug=False)


# ═══════════════════════════════════════════════════════════
#  CLI  entry-point
# ═══════════════════════════════════════════════════════════
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BioGuard Wildlife Risk ML Model")

    parser.add_argument('--train',   action='store_true', help='Train and save the model')
    parser.add_argument('--predict', action='store_true', help='Run a single CLI prediction')
    parser.add_argument('--serve',   action='store_true', help='Start Flask HTTP prediction server')
    parser.add_argument('--port',    type=int, default=5001, help='Port for --serve mode (default 5001)')

    # Prediction arguments
    parser.add_argument('--lat',           type=float, default=26.0)
    parser.add_argument('--lng',           type=float, default=93.0)
    parser.add_argument('--dist_forest',   type=float, default=10.0)
    parser.add_argument('--sightings',     type=float, default=5.0)
    parser.add_argument('--time_hr',       type=float, default=12.0)
    parser.add_argument('--hist_conflicts',type=float, default=2.0)

    args = parser.parse_args()

    if args.train:
        train()

    elif args.serve:
        run_server(port=args.port)

    elif args.predict:
        result = predict(
            args.lat, args.lng, args.dist_forest,
            args.sightings, args.time_hr, args.hist_conflicts,
        )
        print(json.dumps(result, indent=2))

    else:
        # Default: run a single predict and print JSON (for Node.js child_process)
        result = predict(
            args.lat, args.lng, args.dist_forest,
            args.sightings, args.time_hr, args.hist_conflicts,
        )
        print(json.dumps(result))
