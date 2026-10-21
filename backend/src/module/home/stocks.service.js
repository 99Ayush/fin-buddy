'use strict';

/**
 * Stock Service — Live quotes via Finnhub
 *
 * Free tier: 60 calls/minute, supports NSE/BSE symbols
 * Docs: https://finnhub.io/docs/api/quote
 *
 * Usage:
 *   const quotes = await fetchQuotes(['RELIANCE', 'TCS', 'INFY']);
 *   // Returns: { RELIANCE: { c: 2850.50, d: 12.30, dp: 0.43, h: 2860, l: 2830, o: 2845, pc: 2838.20, t: 1699999999 }, ... }
 */

// In-memory cache: symbol -> { data, expiresAt }
const QUOTE_CACHE = new Map();
const CACHE_TTL_MS = 60_000; // 1 minute cache to respect rate limits

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function getApiKey() {
  return process.env.FINNHUB_API_KEY;
}

function isConfigured() {
  return !!getApiKey();
}

// Indian stock suffix for Finnhub (NSE uses .NS, BSE uses .BO)
// Note: Free Finnhub tier doesn't include NSE data - returns 403
const INDIAN_STOCK_SUFFIX = '.NS';

// Common Indian stock symbols that need .NS suffix
const INDIAN_STOCKS = new Set([
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS',
  'WIPRO', 'ITC', 'SBIN', 'BHARTIARTL', 'BAJFINANCE', 'KOTAKBANK',
  'LT', 'HCLTECH', 'ASIANPAINT', 'MARUTI', 'SUNPHARMA', 'TITAN',
  'ULTRACEMCO', 'NESTLEIND', 'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA',
  'BAJAJFINSV', 'ADANIENT', 'ADANIPORTS', 'JSWSTEEL', 'TATASTEEL',
  'HINDALCO', 'INDUSINDBK', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'BRITANNIA',
  'HEROMOTOCO', 'BAJAJ-AUTO', 'EICHERMOT', 'M&M', 'TATACONSUM', 'GRASIM',
  'BPCL', 'IOC', 'GAIL', 'SBILIFE', 'HDFCLIFE', 'TECHM', 'UPL'
]);

// Mock data for Indian stocks (since free Finnhub doesn't support NSE)
const MOCK_INDIAN_QUOTES = {
  'RELIANCE': { current: 2850.50, change: 12.30, changePercent: 0.43, high: 2865, low: 2835, open: 2848, prevClose: 2838.20 },
  'TCS': { current: 3620.75, change: -8.20, changePercent: -0.23, high: 3645, low: 3610, open: 3635, prevClose: 3628.95 },
  'INFY': { current: 1540.25, change: 5.60, changePercent: 0.36, high: 1550, low: 1530, open: 1538, prevClose: 1534.65 },
  'HDFCBANK': { current: 1680.40, change: 15.10, changePercent: 0.91, high: 1690, low: 1670, open: 1675, prevClose: 1665.30 },
  'ICICIBANK': { current: 1140.80, change: -3.20, changePercent: -0.28, high: 1150, low: 1135, open: 1145, prevClose: 1144.00 },
  'TATAMOTORS': { current: 890.15, change: 22.40, changePercent: 2.58, high: 905, low: 880, open: 885, prevClose: 867.75 },
  'WIPRO': { current: 520.60, change: 1.80, changePercent: 0.35, high: 525, low: 518, open: 522, prevClose: 518.80 },
  'ITC': { current: 460.35, change: -1.15, changePercent: -0.25, high: 465, low: 458, open: 462, prevClose: 461.50 },
  'SBIN': { current: 780.20, change: 8.90, changePercent: 1.15, high: 788, low: 775, open: 778, prevClose: 771.30 },
  'BHARTIARTL': { current: 1450.00, change: 12.50, changePercent: 0.87, high: 1460, low: 1440, open: 1445, prevClose: 1437.50 },
};

/**
 * Normalize symbol for Finnhub
 * Indian stocks (NSE) use .NS suffix, US stocks use plain symbol
 */
function normalizeSymbol(symbol) {
  const sym = String(symbol).trim().toUpperCase();
  // If already has exchange prefix/suffix, return as-is
  if (sym.includes(':') || sym.endsWith('.NS') || sym.endsWith('.BO')) return sym;
  // Indian stocks get .NS suffix for Finnhub
  if (INDIAN_STOCKS.has(sym)) return `${sym}${INDIAN_STOCK_SUFFIX}`;
  // Default to US format (no suffix) for US stocks
  return sym;
}

/**
 * Fetch single quote from Finnhub (US stocks) or mock data (Indian stocks)
 */
async function fetchSingleQuote(symbol) {
  const apiKey = getApiKey();
  const normalized = normalizeSymbol(symbol);
  const isIndian = INDIAN_STOCKS.has(symbol.toUpperCase());

  // For Indian stocks, return mock data (Finnhub free tier doesn't support NSE)
  if (isIndian) {
    const mock = MOCK_INDIAN_QUOTES[symbol.toUpperCase()];
    if (mock) {
      return {
        symbol: symbol.toUpperCase(),
        current: mock.current,
        change: mock.change,
        changePercent: mock.changePercent,
        high: mock.high,
        low: mock.low,
        open: mock.open,
        prevClose: mock.prevClose,
        timestamp: Math.floor(Date.now() / 1000),
        source: 'mock',
      };
    }
    throw new Error(`No mock data for ${symbol}`);
  }

  // US stocks - fetch from Finnhub
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(normalized)}&token=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Finnhub ${res.status}: ${errText}`);
  }

  const data = await res.json();

  // Finnhub returns: { c: current, d: change, dp: change%, h: high, l: low, o: open, pc: prevClose, t: timestamp }
  // c=0 means no data / invalid symbol
  if (!data || data.c === 0) {
    throw new Error(`No data for ${symbol}`);
  }

  return {
    symbol: symbol.toUpperCase(),
    current: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
    timestamp: data.t,
    source: 'finnhub',
  };
}

/**
 * Fetch quotes for multiple symbols with caching and rate limiting
 * @param {string[]} symbols - Array of symbols (e.g., ['RELIANCE', 'TCS'])
 * @returns {Promise<Object>} - Map of symbol -> quote data
 */
async function fetchQuotes(symbols) {
  if (!isConfigured()) {
    throw new Error('FINNHUB_API_KEY not configured');
  }

  if (!symbols || !symbols.length) return {};

  const uniqueSymbols = [...new Set(symbols.map(s => s.trim().toUpperCase()).filter(Boolean))];
  const results = {};
  const toFetch = [];

  // Check cache first
  const now = Date.now();
  for (const sym of uniqueSymbols) {
    const cached = QUOTE_CACHE.get(sym);
    if (cached && cached.expiresAt > now) {
      results[sym] = cached.data;
    } else {
      toFetch.push(sym);
    }
  }

  // Fetch missing symbols with rate limiting (max 60/min = 1 per second)
  for (let i = 0; i < toFetch.length; i++) {
    const sym = toFetch[i];
    try {
      const quote = await fetchSingleQuote(sym);
      results[sym] = quote;
      QUOTE_CACHE.set(sym, { data: quote, expiresAt: now + CACHE_TTL_MS });
    } catch (err) {
      console.warn(`[stocks] Failed to fetch ${sym}:`, err.message);
      results[sym] = { symbol: sym, error: err.message };
    }

    // Rate limit: small delay between calls to stay under 60/min
    if (i < toFetch.length - 1) {
      await new Promise(r => setTimeout(r, 1100)); // ~1.1s between calls
    }
  }

  return results;
}

/**
 * Search symbols (for autocomplete)
 */
async function searchSymbols(query) {
  if (!isConfigured()) {
    throw new Error('FINNHUB_API_KEY not configured');
  }

  const apiKey = getApiKey();
  const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub search ${res.status}`);

  const data = await res.json();
  // Return all results (US and international)
  return (data.result || []).map(r => ({
    symbol: r.symbol,
    name: r.description,
    type: r.type,
  }));
}

module.exports = {
  fetchQuotes,
  fetchSingleQuote,
  searchSymbols,
  isConfigured,
  normalizeSymbol,
  CACHE_TTL_MS,
};