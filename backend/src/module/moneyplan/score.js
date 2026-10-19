// score.js – MoneyPlan health score endpoint
const express = require('express');
const router = express.Router();
const { calculateHealthScore } = require('./helpers/scoreHelper');

// GET /score – returns a health score and breakdown
router.get('/', (req, res) => {
  // Example: accept optional query params for financial inputs
  const data = {
    savingsRate: Number(req.query.savingsRate) || 0.2, // 20% default
    debtBurden: Number(req.query.debtBurden) || 0.3,   // 30% default
    emergencyFundMonths: Number(req.query.emergencyFundMonths) || 6,
    expensesRatio: Number(req.query.expensesRatio) || 0.5,
  };
  try {
    const result = calculateHealthScore(data);
    res.json({ status: 'ok', data: result });
  } catch (err) {
    console.error('[score] error', err);
    res.status(500).json({ error: 'Failed to compute score' });
  }
});

module.exports = router;
