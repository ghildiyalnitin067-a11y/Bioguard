const express  = require('express');
const Alert    = require('../models/Alert');
const User     = require('../models/User');
const Report   = require('../models/Report');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { generateAlertMessage } = require('../services/alertMessageGenerator');
const { sendAlertNotification } = require('../services/emailService');
const { getLiveAlerts, pollAndBroadcastLiveAlerts } = require('../services/realTimeAlertService');
const { getAllPredictions, getMLStatus } = require('../services/mlPredictor');
const router   = express.Router();
let broadcast;

/* ════════════════════════════════════════════════════════════════
   GET /api/alerts/live-feed
   Returns a unified feed of:
     1. Real-time GBIF/GFW/satellite alerts (from realTimeAlertService)
     2. Latest DB system alerts
     3. Current ML zone predictions with real-time boosts
   Public — no auth required.
═══════════════════════════════════════════════════════════════ */
router.get('/live-feed', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const lim = parseInt(limit);

    let [recentSystemAlerts, recentAshaAlerts, mlPredictions] =
      await Promise.all([
        Alert.find({ source: 'system' }).sort({ createdAt: -1 }).limit(lim * 3).lean(), // Fetch more to deduplicate
        Alert.find({ source: { $in: ['asha_worker', 'admin'] } })
          .sort({ createdAt: -1 }).limit(lim)
          .populate('reportedBy', 'name role').lean(),
        Promise.resolve(getAllPredictions()),
      ]);

    // Deduplicate system alerts by externalRef (masks previous DB duplicates)
    const uniqueSystem = [];
    const seenRefs = new Set();
    for (const a of recentSystemAlerts) {
      const ref = a.externalRef || a._id.toString();
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        uniqueSystem.push(a);
      }
    }
    recentSystemAlerts = uniqueSystem.slice(0, lim);

    const mlStatus = getMLStatus();

    res.json({
      liveAlerts:       recentSystemAlerts.slice(0, lim),       // Real-time GBIF/GFW/satellite
      systemAlerts:     recentSystemAlerts,              // Also DB alerts
      ashaAlerts:       recentAshaAlerts,               // ASHA worker field alerts
      mlPredictions:    mlPredictions.slice(0, 5),      // Top 5 zone predictions
      mlStatus,
      meta: {
        liveCount:    recentSystemAlerts.length,
        systemCount:  recentSystemAlerts.length,
        ashaCount:    recentAshaAlerts.length,
        mlZones:      mlPredictions.length,
        lastLivePoll: new Date().toISOString(),
        timestamp:    new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[Alerts] live-feed error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   POST /api/alerts/refresh-live  (admin only)
   Manually triggers a real-time data poll and broadcasts results.
═══════════════════════════════════════════════════════════════ */
router.post('/refresh-live', protect, requireRole('admin'), async (req, res) => {
  try {
    const result = await pollAndBroadcastLiveAlerts(broadcast);
    res.json({
      message: `Real-time poll complete. ${result.broadcastCount} alert(s) broadcast.`,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   GET /api/alerts/ml-status
   Returns current ML predictor state including real-time signal activity.
═══════════════════════════════════════════════════════════════ */
router.get('/ml-status', (req, res) => {
  const status = getMLStatus();
  const predictions = getAllPredictions();
  res.json({
    ...status,
    top_predictions: predictions.slice(0, 3).map(p => ({
      zone: p.zone_name,
      risk_score: p.risk_score,
      risk_level: p.risk_level,
      threat: p.threat_type,
      realtime_active: p.data_sources?.realtime_alert_active || false,
      community_active: p.data_sources?.community_reports_signal || false,
    })),
    timestamp: new Date().toISOString(),
  });
});

/* ══════════════════════════════════════════════════════════════════
   GET /api/alerts/by-section
   Returns alerts grouped into three dashboard sections:
     1. realLife     — source = "system"  (real news / satellite)
     2. ashaWorker   — source = "asha_worker" or "admin"
     3. communityReports — latest community Report documents
   Public read — no auth required.
══════════════════════════════════════════════════════════════════ */
router.get('/by-section', async (req, res) => {
  try {
    const { state, limit = 20 } = req.query;
    const baseFilter = {};
    if (state) baseFilter.state = state;

    let [realLife, ashaWorker, communityReports] = await Promise.all([

      /* ── Section 1: Memory real-life system alerts ── */
      Alert.find({ source: 'system', ...(state ? { state } : {}) }).sort({ createdAt: -1 }).limit(parseInt(limit) * 3).lean(),

      /* ── Section 2: ASHA Worker + Admin field alerts ── */
      Alert.find({ ...baseFilter, source: { $in: ['asha_worker', 'admin'] } })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('reportedBy', 'name role state')
        .lean(),

      /* ── Section 3: Community reports (latest pending/reviewed) ── */
      Report.find({ status: { $in: ['pending', 'reviewed'] } })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('submittedBy', 'name role')
        .lean(),
    ]);

    const uniqueRealLife = [];
    const seenRefs = new Set();
    for (const a of realLife) {
      const ref = a.externalRef || a._id.toString();
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        uniqueRealLife.push(a);
      }
    }
    realLife = uniqueRealLife.slice(0, parseInt(limit));

    res.json({
      realLife,
      ashaWorker,
      communityReports,
      counts: {
        realLife: realLife.length,
        ashaWorker: ashaWorker.length,
        communityReports: communityReports.length,
      },
    });
  } catch (err) {
    console.error('[Alerts] by-section error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/alerts  (public read for all roles) ── */
router.get('/', async (req, res) => {
  try {
    const { type, severity, status, state, source, limit = 50 } = req.query;
    const filter = {};
    if (type)     filter.type     = type;
    if (severity) filter.severity = severity;
    if (status)   filter.status   = status;
    if (state)    filter.state    = state;
    if (source)   filter.source   = source;

    let dbAlerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 3) // Fetch more to allow for deduplication
      .populate('reportedBy', 'name role')
      .lean();

    const uniqueAlerts = [];
    const seenRefs = new Set();
    for (const a of dbAlerts) {
      const ref = a.externalRef || a._id.toString();
      if (!seenRefs.has(ref)) {
        seenRefs.add(ref);
        uniqueAlerts.push(a);
      }
    }
    
    let allAlerts = [...uniqueAlerts];
    
    if (type) allAlerts = allAlerts.filter(a => a.type === type);
    if (severity) allAlerts = allAlerts.filter(a => a.severity === severity);
    if (state) allAlerts = allAlerts.filter(a => a.state === state);
    if (source === 'system') allAlerts = allAlerts.filter(a => a.source === 'system');

    res.json({ alerts: allAlerts.slice(0, parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/alerts/:id ── */
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('reportedBy resolvedBy', 'name role').lean();
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/alerts  (asha_worker + admin only) ─────────────────────────
   Auto-generates a village advisory message (English + Hindi) with
   step-by-step solutions and prevention tips for the given type × severity.
   Source is tagged automatically as 'asha_worker' or 'admin'.
──────────────────────────────────────────────────────────────────────────*/
router.post('/', protect, requireRole('asha_worker', 'admin'), async (req, res) => {
  try {
    const { type, severity, location, state, lat, lng, description, action } = req.body;
    if (!type || !severity || !location || lat == null || lng == null)
      return res.status(400).json({ error: 'type, severity, location, lat, lng are required.' });

    /* Auto-generate village message */
    const generated = generateAlertMessage(type, severity, location);

    /* Tag source: asha_worker submitted alerts vs admin */
    const alertSource = req.user.role === 'admin' ? 'admin' : 'asha_worker';

    const alert = await Alert.create({
      type, severity, location,
      state:          state || 'Assam',
      coordinates:    { lat, lng },
      description:    description || '',
      action:         action || '',
      reportedBy:     req.user._id,
      source:         alertSource,
      notificationType: 'field_report',
      /* generated fields */
      headline:       generated.headline,
      headlineHindi:  generated.hindi,
      villageMessage: generated.villageMessage,
      solutions:      generated.solutions,
      prevention:     generated.prevention,
      whatsappText:   generated.whatsappText,
    });

    // Increment user alert count
    req.user.alertsRecv = (req.user.alertsRecv || 0) + 1;
    await req.user.save({ validateBeforeSave: false });

    // WebSocket broadcast — include the full generated advisory
    if (broadcast) broadcast({
      event: 'new_alert',
      data: {
        ...alert.toObject(),
        villageAdvisory: generated,
        sectionTarget: alertSource === 'asha_worker' ? 'ashaWorker' : 'realLife',
      },
    });

    // Email notification — fire-and-forget (don't await, won't block response)
    User.find({ isActive: true }, 'email').lean()
      .then(users => {
        const emails = users.map(u => u.email).filter(Boolean);
        if (emails.length) sendAlertNotification(emails, alert.toObject());
      })
      .catch(e => console.error('[Email] fetch-users error:', e.message));

    console.log(`[Alert] ${alertSource.toUpperCase()} created ${severity} ${type} alert at ${location}`);
    res.status(201).json({ alert });
  } catch (err) {
    console.error('[Alert] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/alerts/:id/message  — return just the village advisory ── */
router.get('/:id/message', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .select('type severity location headline headlineHindi villageMessage solutions prevention whatsappText createdAt');
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });

    /* If message is missing (legacy alert), generate now */
    if (!alert.villageMessage) {
      const generated = generateAlertMessage(alert.type, alert.severity, alert.location);
      alert.headline       = generated.headline;
      alert.headlineHindi  = generated.hindi;
      alert.villageMessage = generated.villageMessage;
      alert.solutions      = generated.solutions;
      alert.prevention     = generated.prevention;
      alert.whatsappText   = generated.whatsappText;
      await alert.save({ validateBeforeSave: false });
    }

    res.json({
      alertId:        alert._id,
      type:           alert.type,
      severity:       alert.severity,
      location:       alert.location,
      headline:       alert.headline,
      headlineHindi:  alert.headlineHindi,
      villageMessage: alert.villageMessage,
      solutions:      alert.solutions,
      prevention:     alert.prevention,
      whatsappText:   alert.whatsappText,
      generatedAt:    alert.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PATCH /api/alerts/:id/resolve  (admin only) ── */
router.patch('/:id/resolve', protect, requireRole('admin'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    if (broadcast) broadcast({ event: 'alert_resolved', data: alert });
    res.json({ alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE /api/alerts/:id  (admin only) ── */
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.setBroadcast = fn => { broadcast = fn; };
module.exports = router;
