const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
  return res.status(401).json({ error: 'No token. Please log in.' });

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+role +isActive');
    if (!user || !user.isActive)
    return res.status(401).json({ error: 'User not found or deactivated.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user)
  return res.status(401).json({ error: 'Not authenticated.' });
  if (!roles.includes(req.user.role))
  return res.status(403).json({
    error: `Access denied. Required role: ${roles.join(' or ')}.`,
    yourRole: req.user.role
  });
  next();
};

module.exports = { protect, requireRole };