/**
 * MoneyPlan Module - Public Interface (P2 Owned)
 * P1 does NOT modify - placeholder for shell mounting
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'MoneyPlan module - P2 owned', endpoints: ['/health', '/goals', '/score'] });
});

router.get('/health', (req, res) => res.json({ status: 'ok', module: 'moneyplan' }));

module.exports = {
  router,
  basePath: '/moneyplan',
};