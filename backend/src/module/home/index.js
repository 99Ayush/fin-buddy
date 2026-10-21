/**
 * Home Module — Public Interface (P3 Owned)
 * All routes except /health are protected by requireAuth.
 */

'use strict';

const express    = require('express');
const router     = express.Router();
const { requireAuth } = require('../auth');
const dashboard  = require('./dashboard.controller');
const markets    = require('./markets.controller');

// ── Public health check ───────────────────────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', module: 'home' }));

// ── Protected dashboard routes ────────────────────────────────────────────────
router.get('/overview',      requireAuth, dashboard.overview);
router.get('/timeline',      requireAuth, dashboard.timeline);
router.get('/activity',      requireAuth, dashboard.activity);
router.get('/next-steps',    requireAuth, dashboard.nextSteps);
router.get('/market-movers', requireAuth, markets.marketMovers);

module.exports = { router, basePath: '/home' };