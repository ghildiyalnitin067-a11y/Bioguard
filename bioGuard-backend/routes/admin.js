const express = require('express');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const Report = require('../models/Report');
const { protect, requireRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/stats', async (req, res) => {
  try {
    const [
    totalUsers, totalAlerts, activeAlerts, resolvedAlerts,
    totalIncidents, ongoingIncidents, totalReports, pendingReports,
    byRole, alertsBySeverity] =
    await Promise.all([
    User.countDocuments(),
    Alert.countDocuments(),
    Alert.countDocuments({ status: 'active' }),
    Alert.countDocuments({ status: 'resolved' }),
    Incident.countDocuments(),
    Incident.countDocuments({ status: 'ongoing' }),
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Alert.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }])]
    );

    res.json({
      stats: {
        totalUsers, totalAlerts, activeAlerts, resolvedAlerts,
        totalIncidents, ongoingIncidents,
        totalReports, pendingReports,
        usersByRole: Object.fromEntries(byRole.map((r) => [r._id, r.count])),
        alertsBySeverity: Object.fromEntries(alertsBySeverity.map((s) => [s._id, s.count]))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { role, state, limit = 100 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (state) filter.state = state;
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'asha_worker', 'admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: user.toPublic(), message: `Role updated to ${role}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ user: user.toPublic(), message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
    return res.status(400).json({ error: 'Cannot delete yourself.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;