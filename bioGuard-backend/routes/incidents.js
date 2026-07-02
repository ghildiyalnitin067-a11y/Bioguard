const express  = require('express');
const Incident = require('../models/Incident');
const { protect, requireRole } = require('../middleware/authMiddleware');
const router   = express.Router();

/* ── GET /api/incidents ── */
router.get('/', async (req, res) => {
  try {
    const { state, severity, status, limit = 100 } = req.query;
    const filter = {};
    if (state)    filter.state    = state;
    if (severity) filter.severity = severity;
    if (status)   filter.status   = status;

    const incidents = await Incident.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('reportedBy', 'name role');

    res.json({ incidents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/incidents/:id ── */
router.get('/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate('reportedBy', 'name role');
    if (!incident) return res.status(404).json({ error: 'Incident not found.' });
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── POST /api/incidents (asha_worker + admin) ── */
router.post('/', protect, requireRole('asha_worker', 'admin'), async (req, res) => {
  try {
    const { animal, location, state, lat, lng, severity, casualties, damage, response, date } = req.body;
    if (!animal || !location || !state || lat == null || lng == null)
      return res.status(400).json({ error: 'animal, location, state, lat, lng required.' });

    const incident = await Incident.create({
      animal, location, state,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      severity:    severity   || 'medium',
      casualties:  casualties || 0,
      damage:      damage     || '',
      response:    response   || '',
      date:        date       || new Date().toLocaleDateString('en-IN'),
      reportedBy:  req.user._id,
    });
    res.status(201).json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PATCH /api/incidents/:id ── */
router.patch('/:id', protect, requireRole('asha_worker', 'admin'), async (req, res) => {
  try {
    const allowed = ['status', 'response', 'severity', 'casualties', 'damage'];
    const update  = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const incident = await Incident.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!incident) return res.status(404).json({ error: 'Incident not found.' });
    res.json({ incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE /api/incidents/:id (admin only) ── */
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await Incident.findByIdAndDelete(req.params.id);
    res.json({ message: 'Incident deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
