// public exports only. Other modules import from here.
const authRouter      = require('./auth.routes');
const { requireAuth } = require('./auth.middleware');

module.exports = { authRouter, requireAuth };
