const express  = require('express');
const Report   = require('../models/Report');
const User     = require('../models/User');
const { protect, requireRole } = require('../middleware/authMiddleware');
const { sendReportNotification } = require('../services/emailService');
const router   = express.Router();
let broadcast;

/* ── helper: generate unique ref ID ── */
function genRefId() {
  return 'RPT-' + Math.floor(1000 + Math.random() * 9000);
}

/* ───────────────────────────────────────────────────
   POST /api/reports
   Public — anyone (logged-in or not) can submit
─────────────────────────────────────────────────────*/
router.post('/', async (req, res) => {
  try {
    const {
      type, region, location, urgency, description,
      files = [], imageData = [], anonymous = false,
      name: contactName = '', phone: contactPhone = '', email: contactEmail = '',
      userId,
    } = req.body;

    if (!type || !region || !location || !urgency || !description)
      return res.status(400).json({ error: 'type, region, location, urgency and description are required.' });

    // Ensure unique refId
    let refId, exists = true;
    while (exists) {
      refId  = genRefId();
      exists = await Report.exists({ refId });
    }

    const report = await Report.create({
      type, region, location, urgency, description,
      files, imageData,
      anonymous,
      contactName:  anonymous ? '' : contactName,
      contactPhone: anonymous ? '' : contactPhone,
      contactEmail: anonymous ? '' : contactEmail,
      submittedBy:  userId || null,
      refId,
    });

    // Increment report count on the user if logged in
    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { reports: 1 } });
    }

    // Email notification to admins + asha_workers — fire-and-forget
    User.find({ role: { $in: ['admin', 'asha_worker'] }, isActive: true }, 'email').lean()
      .then(users => {
        const emails = users.map(u => u.email).filter(Boolean);
        if (emails.length) sendReportNotification(emails, report.toObject());
      })
      .catch(e => console.error('[Email] report notify error:', e.message));

    // ── WebSocket broadcast: notify all connected clients in real-time ──
    if (broadcast) broadcast({
      event: 'new_report',
      data: {
        id:          report._id,
        refId:       report.refId,
        type:        report.type,
        region:      report.region,
        location:    report.location,
        urgency:     report.urgency,
        description: report.description,
        anonymous:   report.anonymous,
        submittedBy: report.submittedBy || null,
        timestamp:   report.createdAt,
        // Include first image for toast preview (base64 may be large — only send 1)
        previewImage: report.imageData?.[0] || null,
        imageCount:   report.imageData?.length || 0,
      },
    });

    res.status(201).json({
      message: 'Report submitted successfully.',
      refId:   report.refId,
      id:      report._id,
    });
  } catch (err) {
    console.error('[Reports] POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────────────────────────────────
   GET /api/reports/mine   — own reports (any logged-in user)
─────────────────────────────────────────────────────*/
router.get('/mine', protect, async (req, res) => {
  try {
    const reports = await Report.find({ submittedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────────────────────────────────
   GET /api/reports  — public (everyone sees all reports)
─────────────────────────────────────────────────────*/
router.get('/', async (req, res) => {
  try {
    const { type, region, status, limit = 100 } = req.query;
    const filter = {};
    if (type)   filter.type   = type;
    if (region) filter.region = region;
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('submittedBy', 'name email role');

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────────────────────────────────
   PATCH /api/reports/:id  — update status, riskLevel, isFake, moderatorNote
   Allowed: asha_worker + admin
─────────────────────────────────────────────────────*/
router.patch('/:id', protect, requireRole('asha_worker', 'admin'), async (req, res) => {
  try {
    const { status, riskLevel, isFake, moderatorNote, urgency } = req.body;

    // Validate status
    if (status && !['pending', 'reviewed', 'resolved', 'fake'].includes(status))
      return res.status(400).json({ error: 'Invalid status.' });
    if (riskLevel && !['low', 'medium', 'high', 'critical'].includes(riskLevel))
      return res.status(400).json({ error: 'Invalid riskLevel.' });

    const update = {};
    if (status        !== undefined) update.status        = status;
    if (riskLevel     !== undefined) update.riskLevel     = riskLevel;
    if (isFake        !== undefined) update.isFake        = isFake;
    if (moderatorNote !== undefined) update.moderatorNote = moderatorNote;
    if (urgency       !== undefined) update.urgency       = urgency;

    // If marked as fake, set status to fake automatically
    if (isFake === true) update.status = 'fake';

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('submittedBy', 'name email role');
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Broadcast status change
    if (broadcast) broadcast({
      event: 'report_updated',
      data: {
        id:     report._id,
        refId:  report.refId,
        status: report.status,
        riskLevel: report.riskLevel,
        timestamp: new Date().toISOString(),
      },
    });

    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Keep old /status route for backward compat ── */
router.patch('/:id/status', protect, requireRole('asha_worker', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'resolved', 'fake'].includes(status))
      return res.status(400).json({ error: 'Invalid status.' });
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json({ error: 'Report not found.' });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────────────────────────────────────────────────
   DELETE /api/reports/:id  — asha_worker + admin can delete fake/invalid reports
─────────────────────────────────────────────────────*/
router.delete('/:id', protect, requireRole('asha_worker', 'admin'), async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Decrement reporter's count if known
    if (report.submittedBy) {
      await User.findByIdAndUpdate(report.submittedBy, { $inc: { reports: -1 } });
    }

    res.json({ message: 'Report deleted.', refId: report.refId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.setBroadcast = fn => { broadcast = fn; };
module.exports = router;
