/**
 * Assistant Module - Public Interface (P3 Owned)
 * P1 does NOT modify - placeholder for shell mounting
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Assistant module - P3 owned', endpoints: ['/ask', '/voice', '/ca-review'] });
});

router.get('/health', (req, res) => res.json({ status: 'ok', module: 'assistant' }));

module.exports = {
  router,
  basePath: '/assistant',
};