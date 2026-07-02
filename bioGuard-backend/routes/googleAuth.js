const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) =>
jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Google credential token required.' });

    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      return res.status(503).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: require('crypto').randomBytes(32).toString('hex'),
        role: 'user',
        avatar: picture || '',
        joinedVia: 'google'
      });
    } else {
      if (!user.avatar && picture) {
        user.avatar = picture;
        await user.save({ validateBeforeSave: false });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      token: signToken(user._id),
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
      message: `Welcome, ${name}!`
    });
  } catch (err) {
    console.error('[Google Auth]', err.message);
    res.status(401).json({ error: 'Google authentication failed. ' + err.message });
  }
});

module.exports = router;