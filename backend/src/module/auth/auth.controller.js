'use strict';

const authService = require('./auth.service');

/** Cookie options — HTTP-only, never accessible from JS */
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,              // HTTPS only in production
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const user  = await authService.register({ name, email, password });
    const token = authService.signToken(user._id);

    res.cookie('finbuddy_token', token, cookieOptions());
    return res.status(201).json({ user: user.toPublic() });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user  = await authService.login({ email, password });
    const token = authService.signToken(user._id);

    res.cookie('finbuddy_token', token, cookieOptions());
    return res.status(200).json({ user: user.toPublic() });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
}

// GET /api/auth/me  (protected — requireAuth attaches req.user)
async function me(req, res) {
  return res.status(200).json({ user: req.user });
}

// POST /api/auth/logout
async function logout(req, res) {
  res.clearCookie('finbuddy_token', { path: '/' });
  return res.status(200).json({ message: 'Logged out.' });
}

module.exports = { register, login, me, logout };
