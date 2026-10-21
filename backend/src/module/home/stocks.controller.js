'use strict';

const { fetchQuotes, searchSymbols, isConfigured } = require('./stocks.service');

/**
 * POST /api/home/stock-quotes
 * Body: { symbols: string[] }
 * Returns live quotes for the given symbols
 */
async function getQuotes(req, res) {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || !symbols.length) {
      return res.status(400).json({
        error: 'symbols array is required',
        example: { symbols: ['RELIANCE', 'TCS', 'INFY'] },
      });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        available: false,
        error: 'Live stock data is not configured. Set FINNHUB_API_KEY environment variable.',
        data: {},
      });
    }

    const quotes = await fetchQuotes(symbols);

    return res.json({
      available: true,
      source: 'finnhub',
      count: Object.keys(quotes).length,
      data: quotes,
    });
  } catch (err) {
    console.error('[home/stock-quotes]', err.message);
    return res.status(500).json({
      available: false,
      error: 'Failed to fetch stock quotes',
      message: err.message,
      data: {},
    });
  }
}

/**
 * GET /api/home/search-stocks?q=RELIANCE
 * Search for stock symbols (autocomplete)
 */
async function searchStocks(req, res) {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length < 1) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        available: false,
        error: 'Stock search is not configured. Set FINNHUB_API_KEY environment variable.',
        results: [],
      });
    }

    const results = await searchSymbols(q.trim());

    return res.json({
      available: true,
      source: 'finnhub',
      count: results.length,
      results,
    });
  } catch (err) {
    console.error('[home/search-stocks]', err.message);
    return res.status(500).json({
      available: false,
      error: 'Failed to search stocks',
      message: err.message,
      results: [],
    });
  }
}

module.exports = { getQuotes, searchStocks };