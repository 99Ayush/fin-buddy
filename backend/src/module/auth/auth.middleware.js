'use strict';

const User              = require('./User.model');
const { verifyToken }   = require('./auth.service');

/**
 * Middleware: verify JWT from HTTP-only cookie.
 * Attaches `req.user` (public fields) on success.
 * Responds 401 on any failure — never reveals the reason to the client.
 */
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.finbuddy_token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const payload = verifyToken(token); // throws if invalid/expired
    const user    = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    req.user = user.toPublic();
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication required.' });
  }
}

module.exports = { requireAuth };
