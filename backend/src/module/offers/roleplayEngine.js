/**
 * Deterministic role-play fallback used when an LLM provider is unavailable.
 * It keeps practice mode usable without fabricating financial figures.
 */
function fallbackTurn({ offer, persona, userMessage, turnNumber }) {
  const name = offer.company?.name || 'the company';
  const ctc = offer.compensation?.ctcAnnual || 0;
  const position = persona === 'aggressive_startup'
    ? 'Our cash budget is constrained, though we can discuss equity.'
    : persona === 'stubborn_enterprise'
      ? 'This package follows our approved compensation band.'
      : 'I appreciate the clear way you have raised this.';
  return {
    hrResponse: `${position} The current offer at ${name} is ₹${(ctc / 100000).toFixed(1)}L CTC. ${turnNumber >= 5 ? 'Thank you; I will take your request back for review.' : `Could you explain how “${userMessage.slice(0, 80)}” supports your request?`}`,
    turnNumber: turnNumber + 1,
    isComplete: turnNumber >= 5,
  };
}

function fallbackScorecard(conversationHistory = []) {
  const text = conversationHistory.join(' ').toLowerCase();
  const hasNumbers = /₹|\d/.test(text);
  const polite = /please|thank|appreciate|would/.test(text);
  const leverage = /offer|market|experience|value/.test(text);
  const scores = {
    assertiveness: text.length > 60 ? 72 : 55,
    professionalism: polite ? 85 : 68,
    leverageUtilization: leverage ? 78 : 52,
    preparation: hasNumbers ? 75 : 55,
    creativeProblemSolving: /equity|bonus|notice|base/.test(text) ? 72 : 55,
  };
  const totalScore = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / 5);
  return {
    scores,
    totalScore,
    feedback: 'State one specific request, connect it to your experience or market evidence, and keep the discussion collaborative.',
    improvedPhrasing: ['Could we discuss aligning the fixed component with the responsibilities of this role?', 'I am enthusiastic about joining and would value your flexibility on this point.'],
    missedOpportunities: ['Ask for a clear timeline and approval process for the counter-offer.'],
  };
}

module.exports = { fallbackTurn, fallbackScorecard };
