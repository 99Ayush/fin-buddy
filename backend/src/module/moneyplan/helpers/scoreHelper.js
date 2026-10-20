// helpers/scoreHelper.js – simple health‑score calculation for MoneyPlan
/**
 * Calculates a financial health score (0‑100) based on a few key metrics.
 * The algorithm is deliberately simple and transparent:
 *   - savingsRate (0‑1)   : 30 % weight
 *   - debtBurden   (0‑1)   : 30 % weight (lower is better)
 *   - emergencyFundMonths : 20 % weight (ideal 6‑12 months)
 *   - expensesRatio (0‑1) : 20 % weight (lower is better)
 *
 * Returns an object:
 *   { score: Number, breakdown: { savingsRateScore, debtScore, emergencyScore, expensesScore } }
 */
function calculateHealthScore({ savingsRate, debtBurden, emergencyFundMonths, expensesRatio }) {
  // Clamp inputs to sensible ranges
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const sRate = clamp(savingsRate, 0, 1);
  const dBurden = clamp(debtBurden, 0, 1);
  const eMonths = clamp(emergencyFundMonths, 0, 24);
  const expRatio = clamp(expensesRatio, 0, 1);

  // Scoring helpers (0‑100 scale)
  const savingsScore = sRate * 100; // higher savings = better
  const debtScore = (1 - dBurden) * 100; // lower debt = better
  const emergencyScore = (Math.min(eMonths, 12) / 12) * 100; // up to 12 months ideal
  const expensesScore = (1 - expRatio) * 100; // lower expense ratio = better

  // Weighted aggregate (weights sum to 1)
  const score =
    0.3 * savingsScore +
    0.3 * debtScore +
    0.2 * emergencyScore +
    0.2 * expensesScore;

  return {
    score: Math.round(score),
    breakdown: {
      savingsRateScore: Math.round(savingsScore),
      debtScore: Math.round(debtScore),
      emergencyFundScore: Math.round(emergencyScore),
      expensesScore: Math.round(expensesScore),
    },
  };
}

module.exports = { calculateHealthScore };
