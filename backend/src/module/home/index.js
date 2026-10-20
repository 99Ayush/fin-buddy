/**
 * Home Module - Public Interface (P3 Owned)
 * P1 does NOT modify - placeholder for shell mounting
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Home/Dashboard module - P3 owned', endpoints: ['/profile', '/timeline', '/market-movers'] });
});

router.get('/health', (req, res) => res.json({ status: 'ok', module: 'home' }));

module.exports = {
  router,
  basePath: '/home',
};