const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google OAuth sign-in / sign-up
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
  const { credential, role } = req.body;

  if (!credential) {
    res.status(400);
    throw new Error('Google credential token is required');
  }

  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    res.status(503);
    throw new Error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in backend .env');
  }

  // Verify the Google ID token
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    res.status(401);
    throw new Error('Invalid Google token');
  }

  const { sub: googleId, email, name, picture } = payload;

  // Check if user already exists (by Google ID or email)
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Existing user — link Google ID if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Account has been deactivated. Contact admin.');
    }
  } else {
    // New user — auto-register with chosen role (default: buyer)
    const allowedRoles = ['buyer', 'seller'];
    const userRole = allowedRoles.includes(role) ? role : 'buyer';

    user = await User.create({
      name,
      email,
      googleId,
      avatar: picture || null,
      role: userRole,
      // No password — Google users don't need one
    });
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    },
  });
});

module.exports = { googleAuth };
