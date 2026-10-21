'use strict';

/**
 * Markets Controller — Market Movers
 *
 * IMPORTANT:
 * No live market data provider is configured in this repository.
 * This endpoint returns clearly-labelled MOCK / DEMO data.
 * It must NEVER be presented as real, live, or investment advice.
 *
 * When a real provider (e.g. Alpha Vantage, NSE feed) is configured
 * via environment variable, replace MOCK_MOVERS with a real fetch.
 */

const MOCK_MOVERS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', change: '+3.4%', direction: 'up', note: 'demo' },
  { symbol: 'INFY',     name: 'Infosys',             change: '+2.1%', direction: 'up', note: 'demo' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank',           change: '-1.8%', direction: 'down', note: 'demo' },
  { symbol: 'TCS',      name: 'TCS',                 change: '+1.2%', direction: 'up', note: 'demo' },
  { symbol: 'WIPRO',    name: 'Wipro',               change: '-0.9%', direction: 'down', note: 'demo' },
];

const PROVIDER_CONFIGURED = !!(process.env.MARKET_DATA_API_KEY);

/**
 * GET /api/home/market-movers
 * Returns top market movers. Mock data when no provider is configured.
 */
async function marketMovers(req, res) {
  if (!PROVIDER_CONFIGURED) {
    return res.json({
      available: false,
      message: 'Live market data is not configured. Showing demo data for educational purposes only.',
      disclaimer: 'This is not real-time data. Not investment advice. Not SEBI registered.',
      dataSource: 'demo',
      refreshedAt: null,
      movers: MOCK_MOVERS,
    });
  }

  // Real provider path — placeholder for future integration
  try {
    // TODO: fetch from configured provider using process.env.MARKET_DATA_API_KEY
    return res.json({
      available: false,
      message: 'Market data provider is configured but integration is not yet complete.',
      disclaimer: 'Not investment advice. Not SEBI registered.',
      dataSource: 'pending',
      refreshedAt: null,
      movers: [],
    });
  } catch (err) {
    console.error('[home/market-movers]', err.message);
    return res.status(503).json({
      available: false,
      message: 'Market data is temporarily unavailable.',
      disclaimer: 'Not investment advice. Not SEBI registered.',
      movers: [],
    });
  }
}

module.exports = { marketMovers };
