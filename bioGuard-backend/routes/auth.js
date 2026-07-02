const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const signToken = (id) =>
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuthResponse = (res, statusCode, user, message = '') => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      state: user.state,
      bio: user.bio,
      avatar: user.avatar,
      reports: user.reports,
      alertsRecv: user.alertsRecv,
      joined: user.joined
    },
    message
  });
};

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'user', state = 'Assam' } = req.body;
    if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required.' });

    const safeRole = ['asha_worker', 'admin'].includes(role) ? 'user' : role;

    const existing = await User.findOne({ email });
    if (existing)
    return res.status(409).json({ error: 'Email already registered.' });

    const user = await User.create({ name, email, password, role: safeRole, state });
    sendAuthResponse(res, 201, user, 'Account created successfully.');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password +role');
    if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Invalid email or password.' });

    if (!user.isActive)
    return res.status(403).json({ error: 'Account deactivated. Contact admin.' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendAuthResponse(res, 200, user, 'Logged in successfully.');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

router.patch('/profile', protect, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'state'];
    const updates = {};
    allowed.forEach((k) => {if (req.body[k] !== undefined) updates[k] = req.body[k];});

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user: user.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;