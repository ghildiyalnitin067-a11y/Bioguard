const express = require('express');
const Alert = require('../models/Alert');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { generateAlertMessage } = require('../services/alertMessageGenerator');
const { sendAlertNotification } = require('../services/emailService');
const { getLiveAlerts, pollAndBroadcastLiveAlerts } = require('../services/realTimeAlertService');
const { getAllPredictions, getMLStatus } = require('../services/mlPredictor');
const router = express.Router();
let broadcast;

router.get('/live-feed', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const lim = parseInt(limit);

    let [recentSystemAlerts, recentAshaAlerts, mlPredictions] =
    await Promise.all([
    Alert.find({ source: 'system' }).sort({ createdAt: -1 }).limit(lim * 3).lean(),
    Alert.find({ source: { $in: ['asha_worker', 'admin'] } }).
    sort({ createdAt: -1 }).limit(lim).
    populate('reportedBy', 'name role').lean(),
    Promise.resolve(getAllPredictions())]
    );

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
      liveAlerts: recentSystemAlerts.slice(0, lim),
      systemAlerts: recentSystemAlerts,
      ashaAlerts: recentAshaAlerts,
      mlPredictions: mlPredictions.slice(0, 5),
      mlStatus,
      meta: {
        liveCount: recentSystemAlerts.length,
        systemCount: recentSystemAlerts.length,
        ashaCount: recentAshaAlerts.length,
        mlZones: mlPredictions.length,
        lastLivePoll: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Alerts] live-feed error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh-live', protect, requireRole('admin'), async (req, res) => {
  try {
    const result = await pollAndBroadcastLiveAlerts(broadcast);
    res.json({
      message: `Real-time poll complete. ${result.broadcastCount} alert(s) broadcast.`,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ml-status', (req, res) => {
  const status = getMLStatus();
  const predictions = getAllPredictions();
  res.json({
    ...status,
    top_predictions: predictions.slice(0, 3).map((p) => ({
      zone: p.zone_name,
      risk_score: p.risk_score,
      risk_level: p.risk_level,
      threat: p.threat_type,
      realtime_active: p.data_sources?.realtime_alert_active || false,
      community_active: p.data_sources?.community_reports_signal || false
    })),
    timestamp: new Date().toISOString()
  });
});

router.get('/by-section', async (req, res) => {
  try {
    const { state, limit = 20 } = req.query;
    const baseFilter = {};
    if (state) baseFilter.state = state;

    let [realLife, ashaWorker, communityReports] = await Promise.all([

    Alert.find({ source: 'system', ...(state ? { state } : {}) }).sort({ createdAt: -1 }).limit(parseInt(limit) * 3).lean(),

    Alert.find({ ...baseFilter, source: { $in: ['asha_worker', 'admin'] } }).
    sort({ createdAt: -1 }).
    limit(parseInt(limit)).
    populate('reportedBy', 'name role state').
    lean(),

    Report.find({ status: { $in: ['pending', 'reviewed'] } }).
    sort({ createdAt: -1 }).
    limit(parseInt(limit)).
    populate('submittedBy', 'name role').
    lean()]
    );

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
        communityReports: communityReports.length
      }
    });
  } catch (err) {
    console.error('[Alerts] by-section error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, severity, status, state, source, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (state) filter.state = state;
    if (source) filter.source = source;

    let dbAlerts = await Alert.find(filter).
    sort({ createdAt: -1 }).
    limit(parseInt(limit) * 3).
    populate('reportedBy', 'name role').
    lean();

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

    if (type) allAlerts = allAlerts.filter((a) => a.type === type);
    if (severity) allAlerts = allAlerts.filter((a) => a.severity === severity);
    if (state) allAlerts = allAlerts.filter((a) => a.state === state);
    if (source === 'system') allAlerts = allAlerts.filter((a) => a.source === 'system');

    res.json({ alerts: allAlerts.slice(0, parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).populate('reportedBy resolvedBy', 'name role').lean();
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    res.json({ alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', protect, requireRole('asha_worker', 'admin'), async (req, res) => {
  try {
    const { type, severity, location, state, lat, lng, description, action } = req.body;
    if (!type || !severity || !location || lat == null || lng == null)
    return res.status(400).json({ error: 'type, severity, location, lat, lng are required.' });

    const generated = generateAlertMessage(type, severity, location);

    const alertSource = req.user.role === 'admin' ? 'admin' : 'asha_worker';

    const alert = await Alert.create({
      type, severity, location,
      state: state || 'Assam',
      coordinates: { lat, lng },
      description: description || '',
      action: action || '',
      reportedBy: req.user._id,
      source: alertSource,
      notificationType: 'field_report',
      headline: generated.headline,
      headlineHindi: generated.hindi,
      villageMessage: generated.villageMessage,
      solutions: generated.solutions,
      prevention: generated.prevention,
      whatsappText: generated.whatsappText
    });

    req.user.alertsRecv = (req.user.alertsRecv || 0) + 1;
    await req.user.save({ validateBeforeSave: false });

    if (broadcast) broadcast({
      event: 'new_alert',
      data: {
        ...alert.toObject(),
        villageAdvisory: generated,
        sectionTarget: alertSource === 'asha_worker' ? 'ashaWorker' : 'realLife'
      }
    });

    User.find({ isActive: true }, 'email').lean().
    then((users) => {
      const emails = users.map((u) => u.email).filter(Boolean);
      if (emails.length) sendAlertNotification(emails, alert.toObject());
    }).
    catch((e) => console.error('[Email] fetch-users error:', e.message));

    console.log(`[Alert] ${alertSource.toUpperCase()} created ${severity} ${type} alert at ${location}`);
    res.status(201).json({ alert });
  } catch (err) {
    console.error('[Alert] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/message', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).
    select('type severity location headline headlineHindi villageMessage solutions prevention whatsappText createdAt');
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });

    if (!alert.villageMessage) {
      const generated = generateAlertMessage(alert.type, alert.severity, alert.location);
      alert.headline = generated.headline;
      alert.headlineHindi = generated.hindi;
      alert.villageMessage = generated.villageMessage;
      alert.solutions = generated.solutions;
      alert.prevention = generated.prevention;
      alert.whatsappText = generated.whatsappText;
      await alert.save({ validateBeforeSave: false });
    }

    res.json({
      alertId: alert._id,
      type: alert.type,
      severity: alert.severity,
      location: alert.location,
      headline: alert.headline,
      headlineHindi: alert.headlineHindi,
      villageMessage: alert.villageMessage,
      solutions: alert.solutions,
      prevention: alert.prevention,
      whatsappText: alert.whatsappText,
      generatedAt: alert.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Alert deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.setBroadcast = (fn) => {broadcast = fn;};
module.exports = router;