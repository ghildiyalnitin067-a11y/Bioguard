/**
 * ml.js — /api/ml routes
 * ───────────────────────────────────────────────
 * POST /api/ml/predict   — Python RF prediction (with JS fallback)
 * GET  /api/ml/health    — Python service health check
 * POST /api/ml/train     — Trigger Python model retrain
 * GET  /api/ml/features  — Return auto-computed feature vector for a lat/lng
 */

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  predictWithPython,
  triggerPythonTrain,
  isPythonMLAvailable,
  buildFeatures,
} = require('../ml/mlBridge');
const {
  getAllPredictions,
  getLastRefreshed,
  getMLStatus,
  refreshAllPredictions,
} = require('../services/mlPredictor');
const { getLiveAlerts } = require('../services/realTimeAlertService');

/* ══════════════════════════════════════
   POST /api/ml/predict
   Body: { lat, lng, [dist_forest], [sightings], [time_hr], [hist_conflicts] }
   Returns: risk_score, risk_level, confidence, model, source, features_used
══════════════════════════════════════ */
router.post('/predict', async (req, res) => {
  try {
    const { lat, lng, ...extra } = req.body || {};
    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required.' });
    }
    const latF = parseFloat(lat);
    const lngF = parseFloat(lng);
    if (isNaN(latF) || isNaN(lngF)) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers.' });
    }

    const result = await predictWithPython(latF, lngF, extra);
    res.json(result);
  } catch (err) {
    console.error('[/api/ml/predict]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════
   GET /api/ml/health
   Checks if the Python ML service is reachable
══════════════════════════════════════ */
router.get('/health', async (req, res) => {
  const pythonOk = await isPythonMLAvailable();
  res.json({
    python_ml_service: pythonOk ? 'online' : 'offline',
    active_model:      pythonOk ? 'Python RandomForestRegressor (model.py)' : 'JS Random Forest (fallback)',
    strategy:          'Python sklearn is PRIMARY; JS predictor auto-activates if Python is offline',
    js_fallback:       'always available',
    python_url:        `http://localhost:${process.env.ML_PORT || 5001}`,
    timestamp:         new Date().toISOString(),
  });
});

/* ══════════════════════════════════════
   POST /api/ml/train  (admin only)
   Triggers Python model retrain
══════════════════════════════════════ */
router.post('/train', protect, async (req, res) => {
  try {
    const result = await triggerPythonTrain();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════
   GET /api/ml/features?lat=&lng=
   Returns computed feature vector for debugging
══════════════════════════════════════ */
router.get('/features', (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng query params required.' });
  try {
    const features = buildFeatures(parseFloat(lat), parseFloat(lng));
    res.json({ features });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════
   GET /api/ml/status
   Full ML pipeline status: Python health + cached predictions +
   real-time alert boosts + community report signals
══════════════════════════════════════ */
router.get('/status', async (req, res) => {
  try {
    const pythonOk     = await isPythonMLAvailable();
    const mlStatus     = getMLStatus();
    const predictions  = getAllPredictions();
    const { lastPoll, alerts: liveAlerts } = getLiveAlerts();

    res.json({
      python_ml_service:       pythonOk ? 'online' : 'offline',
      active_model:            pythonOk ? 'Python RandomForestRegressor (sklearn)' : 'JS Random Forest (fallback)',
      strategy:                'Python sklearn PRIMARY; JS auto-activates if Python offline',
      js_fallback:             'always available',
      ...mlStatus,
      live_alert_pipeline: {
        last_polled:   lastPoll,
        cached_alerts: liveAlerts.length,
        active:        liveAlerts.length > 0,
      },
      cached_predictions:      predictions.length,
      last_prediction_refresh: getLastRefreshed(),
      top_risk_zones: predictions.slice(0, 3).map(p => ({
        zone:             p.zone_name,
        risk_score:       p.risk_score,
        risk_level:       p.risk_level,
        threat:           p.threat_type,
        realtime_active:  p.data_sources?.realtime_alert_active  || false,
        community_active: p.data_sources?.community_reports_signal || false,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════
   POST /api/ml/refresh
   Manually trigger ML refresh (admin only)
══════════════════════════════════════ */
router.post('/refresh', protect, async (req, res) => {
  try {
    const predictions = await refreshAllPredictions();
    res.json({
      message: `ML refresh complete. ${predictions.length} zone predictions updated.`,
      count:   predictions.length,
      last_refreshed: getLastRefreshed(),
      top_risk: predictions[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
