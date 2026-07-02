const express  = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  predictRisk, refreshAllPredictions,
  getAllPredictions, getLastRefreshed, ZONES,
} = require('../services/mlPredictor');
const router   = express.Router();

/* ────────────────────────────────────────────────────
   GET /api/analysis
   Returns cached predictions (quick, no DB call)
──────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  res.json({
    predictions:    getAllPredictions(),
    last_refreshed: getLastRefreshed(),
    source:         'cache',
  });
});

/* ────────────────────────────────────────────────────
   GET /api/analysis/live
   Pulls LIVE stats from Reports + Incidents + ML cache
   and sends a rich dashboard payload.
──────────────────────────────────────────────────── */
router.get('/live', protect, async (req, res) => {
  try {
    const Report   = require('../models/Report');
    const Incident = require('../models/Incident');
    const since30  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7   = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

    /* ── Parallel DB queries ── */
    const [
      totalReports,
      recentReports,
      reportsByType,
      reportsByRegion,
      reportsByUrgency,
      reportsByStatus,
      reportTrend,
      totalIncidents,
      recentIncidents,
      incidentsBySeverity,
      incidentsByState,
      incidentTrend,
    ] = await Promise.all([
      /* Total reports */
      Report.countDocuments(),
      /* Reports last 7 days */
      Report.countDocuments({ createdAt: { $gte: since7 } }),
      /* Reports by type */
      Report.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      /* Reports by region */
      Report.aggregate([
        { $group: { _id: '$region', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      /* Reports by urgency */
      Report.aggregate([
        { $group: { _id: '$urgency', count: { $sum: 1 } } },
      ]),
      /* Reports by status */
      Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      /* Daily report trend — last 30 days */
      Report.aggregate([
        { $match: { createdAt: { $gte: since30 } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
      /* Total incidents */
      Incident.countDocuments(),
      /* Incidents last 7 days */
      Incident.countDocuments({ createdAt: { $gte: since7 } }),
      /* Incidents by severity */
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      /* Incidents by state */
      Incident.aggregate([
        { $group: { _id: '$state', count: { $sum: 1 }, avgCasualties: { $avg: '$casualties' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      /* Daily incident trend — last 30 days */
      Incident.aggregate([
        { $match: { createdAt: { $gte: since30 } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count:      { $sum: 1 },
          casualties: { $sum: '$casualties' },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    /* ── alert type breakdown from reports (for pie chart) ── */
    const COLORS = {
      wildlife:      '#ab47bc',
      deforestation: '#fb8c00',
      fire:          '#e53935',
      poaching:      '#ef5350',
      other:         '#78909c',
    };
    const alertTypeChartData = reportsByType.map(r => ({
      name:  r._id,
      value: r.count,
      color: COLORS[r._id] || '#78909c',
    }));

    /* ── region breakdown for bar chart ── */
    const regionChartData = reportsByRegion.map(r => ({
      region: r._id,
      reports: r.count,
    }));

    /* ── ML predictions (refreshed from DB) ── */
    const predictions = await refreshAllPredictions();
    const criticalZones  = predictions.filter(p => p.risk_level === 'critical');
    const highRiskZones  = predictions.filter(p => p.risk_level === 'high');
    const avgRisk        = predictions.length
      ? (predictions.reduce((s, p) => s + p.risk_score, 0) / predictions.length).toFixed(3)
      : 0;

    /* ── urgency / status maps ── */
    function toMap(arr) {
      return arr.reduce((m, r) => { m[r._id] = r.count; return m; }, {});
    }

    res.json({
      generated_at:  new Date().toISOString(),
      summary: {
        totalReports,
        recentReports,
        totalIncidents,
        recentIncidents,
        criticalZones:  criticalZones.length,
        highRiskZones:  highRiskZones.length,
        avgRiskScore:   parseFloat(avgRisk),
      },
      reports: {
        byType:     alertTypeChartData,
        byRegion:   regionChartData,
        byUrgency:  toMap(reportsByUrgency),
        byStatus:   toMap(reportsByStatus),
        trend:      reportTrend.map(r => ({ date: r._id, count: r.count })),
      },
      incidents: {
        bySeverity: toMap(incidentsBySeverity),
        byState:    incidentsByState.map(r => ({ state: r._id, count: r.count, avgCasualties: parseFloat((r.avgCasualties || 0).toFixed(1)) })),
        trend:      incidentTrend.map(r => ({ date: r._id, count: r.count, casualties: r.casualties })),
      },
      predictions: {
        all:          predictions,
        critical:     criticalZones,
        high:         highRiskZones,
        last_refreshed: getLastRefreshed(),
      },
    });
  } catch (err) {
    console.error('[Analysis] /live error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ────────────────────────────────────────────────────
   POST /api/analysis/predict  (on-demand, single zone)
──────────────────────────────────────────────────── */
router.post('/predict', protect, (req, res) => {
  const { lat, lng, zone_name, threat_type } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required.' });
  const result = predictRisk(parseFloat(lat), parseFloat(lng), zone_name || '', threat_type);
  res.json({ prediction: result });
});

/* ────────────────────────────────────────────────────
   POST /api/analysis/refresh  (force re-run all zones)
──────────────────────────────────────────────────── */
router.post('/refresh', protect, async (req, res) => {
  const predictions = await refreshAllPredictions();
  res.json({ message: 'Predictions refreshed from live DB data.', count: predictions.length, predictions });
});

module.exports = router;
