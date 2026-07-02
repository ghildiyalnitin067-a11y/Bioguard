/**
 * mlBridge.js  — Node.js ↔ Python ML microservice bridge
 * ─────────────────────────────────────────────────────────
 * Strategy:
 *   1. Try calling the Python Flask server (localhost:5001)
 *   2. If Flask is unavailable, fall back to the JS predictor
 *
 * The Python server is started automatically by start-backend.bat
 * (or you can run: python backend/ml/model.py --serve)
 */

const http = require('http');

const ML_HOST = process.env.ML_HOST || 'localhost';
const ML_PORT = parseInt(process.env.ML_PORT || '5001', 10);
const ML_TIMEOUT_MS = 5000; // 5 s timeout before falling back

/* ─── Helper: POST JSON to Python Flask ─────────────────── */
function callPythonML(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: ML_HOST,
      port:     ML_PORT,
      path,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try   { resolve(JSON.parse(data)); }
        catch  { reject(new Error('Invalid JSON from Python ML service')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(ML_TIMEOUT_MS, () => {
      req.destroy(new Error(`Python ML service timed out after ${ML_TIMEOUT_MS}ms`));
    });
    req.write(payload);
    req.end();
  });
}

/* ─── Ping Python health endpoint ───────────────────────── */
function pingPython() {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: ML_HOST, port: ML_PORT, path: '/health', timeout: 2000 },
      (res) => {
        let d = '';
        res.on('data', c => { d += c; });
        res.on('end', () => {
          try { resolve(JSON.parse(d)?.status === 'ok'); }
          catch { resolve(false); }
        });
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

/* ─── JS distance helper ────────────────────────────────── */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, r = d => d * Math.PI / 180;
  const dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Build ML feature vector from lat/lng ──────────────── */
function buildFeatures(lat, lng) {
  // These reference forests in NE India (Kaziranga, Namdapha, Manas, etc.)
  const FOREST_ZONES = [
    { lat: 26.60, lng: 93.45 }, // Kaziranga
    { lat: 27.50, lng: 96.20 }, // Namdapha
    { lat: 26.72, lng: 91.10 }, // Manas
    { lat: 24.55, lng: 93.90 }, // Keibul Lamjao
    { lat: 25.42, lng: 90.35 }, // Nokrek
    { lat: 25.50, lng: 94.08 }, // Dzukou
    { lat: 27.03, lng: 92.38 }, // Eaglenest
    { lat: 27.60, lng: 88.20 }, // Khangchendzonga
  ];

  const distForest = Math.min(
    ...FOREST_ZONES.map(z => haversineKm(lat, lng, z.lat, z.lng))
  );

  const hour = new Date().getHours();

  // Empirical sightings estimate from GBIF density across NE India
  const baseSightings = Math.max(0, 80 - distForest * 1.2);

  return {
    lat,
    lng,
    dist_forest:    parseFloat(distForest.toFixed(2)),
    sightings:      parseFloat(baseSightings.toFixed(1)),
    time_hr:        hour,
    hist_conflicts: parseFloat(Math.max(0, baseSightings * 0.25).toFixed(1)),
  };
}

/* ─── JS fallback ML predictor ──────────────────────────── */
// NOTE: mlPredictor is NOT required at module level to avoid circular dependency
// (mlPredictor requires mlBridge which would require mlPredictor again).
// Lazy require inside the function is safe — by call time both modules are loaded.
function jsFallbackPredict(lat, lng) {
  const { predictRisk: jsPred } = require('../services/mlPredictor');
  // We'll enrich the JS result to match the Python schema
  const jsResult = jsPred(lat, lng, '');
  return {
    risk_score:    jsResult.risk_score,
    risk_level:    jsResult.risk_level,
    confidence:    jsResult.confidence,
    model:         'JS Random Forest (fallback — Python service unavailable)',
    features_used: buildFeatures(lat, lng),
    source:        'js_fallback',
  };
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC API
═══════════════════════════════════════════════════════════ */

/**
 * predictWithPython(lat, lng, [extraFeatures])
 *
 * Calls the Python Flask ML microservice.
 * Falls back to the JS predictor if Flask is down.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {object} [extra]  — override auto-computed features
 * @returns {Promise<object>}
 */
async function predictWithPython(lat, lng, extra = {}) {
  const features = { ...buildFeatures(lat, lng), ...extra };

  try {
    const result = await callPythonML('/predict', features);
    return { ...result, source: 'python_ml', features_used: features };
  } catch (err) {
    console.warn(`[mlBridge] Python ML unavailable (${err.message}). Using JS fallback.`);
    return jsFallbackPredict(lat, lng);
  }
}

/**
 * triggerPythonTrain()
 *
 * Asks the Python service to retrain the model.
 */
async function triggerPythonTrain() {
  try {
    return await callPythonML('/train', {});
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * isPythonMLAvailable()
 * Quick health check — returns true/false.
 */
async function isPythonMLAvailable() {
  return pingPython();
}

module.exports = { predictWithPython, triggerPythonTrain, isPythonMLAvailable, buildFeatures };
