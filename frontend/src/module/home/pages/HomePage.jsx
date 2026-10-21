/**
 * Home Page — Fin-Buddy Authenticated Landing Dashboard
 * Displays:
 *  - User Invested Stocks widget (live quotes via API, leaderboard, empty state with guidance)
 *  - EMI Calculator widget (interactive live loan calculations)
 *  - EMI Reminder widget (upcoming loan installment deadlines, status & alerts)
 *  - Recommended Steps on the right side
 *  - Financial Health score breakdown & Savings Goals
 *  - Document overview, timeline, and recent activity
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../components/AppLayout';
import {
  getOverview,
  getTimeline,
  getActivity,
  getNextSteps,
  getSavingsGoals,
  getFinancialHealthScore,
  getStockQuotes,
  searchStocks,
} from '../services/homeApi';
import { t } from '../i18n';

// ── Reusable Tiny UI Components ──────────────────────────────────────────────

const SectionTitle = ({ children, badge, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <h2 style={{
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text-main, #1e293b)',
        margin: 0,
        letterSpacing: '-0.02em',
      }}>
        {children}
      </h2>
      {badge && (
        <span style={{
          padding: '2px 8px',
          background: 'var(--primary-subtle, #eff6ff)',
          color: 'var(--primary, #2563eb)',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          border: '1px solid #bfdbfe',
        }}>
          {badge}
        </span>
      )}
    </div>
    {action}
  </div>
);

const EmptyState = ({ icon = '📭', title, hint, cta, onCtaClick, ctaHref }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    background: 'var(--bg-subtle, #f8fafc)',
    borderRadius: 'var(--radius-md, 12px)',
    border: '1.5px dashed var(--border-subtle, #e2e8f0)',
    textAlign: 'center',
    gap: 8,
  }}>
    <span style={{ fontSize: 36, lineHeight: 1 }}>{icon}</span>
    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main, #1e293b)', fontSize: 15 }}>{title}</p>
    {hint && <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: 13, maxWidth: 380, lineHeight: 1.5 }}>{hint}</p>}
    {cta && ctaHref && (
      <Link
        to={ctaHref}
        style={{
          marginTop: 10,
          padding: '8px 18px',
          background: 'var(--primary, #2563eb)',
          color: '#fff',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 13,
          textDecoration: 'none',
        }}
      >
        {cta}
      </Link>
    )}
    {cta && onCtaClick && (
      <button
        onClick={onCtaClick}
        style={{
          marginTop: 10,
          padding: '8px 18px',
          background: 'var(--primary, #2563eb)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {cta}
      </button>
    )}
  </div>
);

const LoadingCard = () => (
  <div style={{
    padding: 24,
    background: 'var(--bg-subtle, #f8fafc)',
    borderRadius: 'var(--radius-md, 12px)',
    animation: 'pulse 1.4s ease-in-out infinite',
    minHeight: 80,
  }} />
);

const ErrorCard = ({ message, onRetry, lang }) => (
  <div style={{
    padding: 16,
    background: '#fff5f5',
    border: '1px solid #fecdd3',
    borderRadius: 'var(--radius-md, 12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  }}>
    <span style={{ color: '#be123c', fontSize: 13.5 }}>⚠️ {message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '6px 14px',
          background: '#be123c',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 12.5,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {t(lang, 'retry')}
      </button>
    )}
  </div>
);

function formatCurrency(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
}

// ── Hook: fetch a Home API section ───────────────────────────────────────────

function useHomeSection(fetcher) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

// Extended list of popular Indian stocks for clickable selection
const POPULAR_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', defaultPrice: 2850 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', defaultPrice: 3620 },
  { symbol: 'INFY', name: 'Infosys', defaultPrice: 1540 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', defaultPrice: 1680 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', defaultPrice: 1140 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', defaultPrice: 890 },
  { symbol: 'WIPRO', name: 'Wipro', defaultPrice: 520 },
  { symbol: 'ITC', name: 'ITC Ltd', defaultPrice: 460 },
  { symbol: 'SBIN', name: 'State Bank of India', defaultPrice: 780 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', defaultPrice: 1450 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', defaultPrice: 7200 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', defaultPrice: 1800 },
  { symbol: 'LT', name: 'Larsen & Toubro', defaultPrice: 3500 },
  { symbol: 'HCLTECH', name: 'HCL Technologies', defaultPrice: 1350 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', defaultPrice: 3200 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', defaultPrice: 11000 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharma', defaultPrice: 1400 },
  { symbol: 'TITAN', name: 'Titan Company', defaultPrice: 3400 },
];

// ── 1. USER INVESTED STOCKS WIDGET ───────────────────────────────────────────
/**
 * Shows ONLY the stocks the user has invested in.
 * - Uses Live Stock API via getStockQuotes (/api/home/stock-quotes)
 * - Empty state when no stocks invested
 * - Shows max 3 stocks, 'Show All' expands
 * - Leaderboard button in top bar (modal with all popular stocks + live quotes)
 * - Clickable stock selection (no typing) with duplicate prevention
 * - Real-time profit / loss calculations
 */
function InvestedStocksWidget({ user }) {
  const storageKey = `finbuddy_stocks_${user?.id || 'guest'}`;

  const [stocks, setStocks] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    shares: '',
    buyPrice: '',
  });
  const [formError, setFormError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Live price fetching state from Stock API
  const [liveQuotes, setLiveQuotes] = useState({});
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Persist stocks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stocks));
    } catch (err) {
      console.warn('Could not persist stocks:', err);
    }
  }, [stocks, storageKey]);

  // Fetch live quotes via Stock API
  const fetchQuotesForSymbols = useCallback(async (symbolsToFetch) => {
    if (!symbolsToFetch || !symbolsToFetch.length) return;

    setLiveLoading(true);
    setLiveError('');

    try {
      const response = await getStockQuotes(symbolsToFetch);
      if (response && response.data) {
        setLiveQuotes(prev => ({ ...prev, ...response.data }));
        setLastUpdated(new Date());
      } else if (response && !response.available) {
        setLiveError(response.error || 'Live prices not available.');
      }
    } catch (err) {
      setLiveError(err.message || 'Failed to fetch live prices');
    } finally {
      setLiveLoading(false);
    }
  }, []);

  // Refresh user holdings prices
  const handleRefreshPrices = useCallback(() => {
    if (stocks.length > 0) {
      fetchQuotesForSymbols(stocks.map(s => s.symbol));
    }
  }, [stocks, fetchQuotesForSymbols]);

  // Fetch quotes on mount if stocks exist
  useEffect(() => {
    if (stocks.length > 0) {
      fetchQuotesForSymbols(stocks.map(s => s.symbol));
    }
  }, []);

  // When opening leaderboard, fetch quotes for popular stocks if not already loaded
  useEffect(() => {
    if (showLeaderboard) {
      fetchQuotesForSymbols(POPULAR_STOCKS.map(s => s.symbol));
    }
  }, [showLeaderboard, fetchQuotesForSymbols]);

  // Merge live quotes into stocks for display (MUST be declared before portfolioMetrics)
  const displayStocks = useMemo(() => {
    return stocks.map(s => {
      const quote = liveQuotes[s.symbol];
      if (quote && quote.current && !quote.error) {
        return {
          ...s,
          currentPrice: quote.current,
          liveChange: quote.change,
          liveChangePercent: quote.changePercent,
        };
      }
      return s;
    });
  }, [stocks, liveQuotes]);

  // Compute portfolio metrics (uses live prices when available)
  const portfolioMetrics = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;

    displayStocks.forEach(s => {
      const qty = Number(s.shares) || 0;
      totalInvested += qty * (Number(s.buyPrice) || 0);
      totalCurrent += qty * (Number(s.currentPrice) || Number(s.buyPrice) || 0);
    });

    const totalPnl = totalCurrent - totalInvested;
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalPnl,
      pnlPercent,
      count: displayStocks.length,
    };
  }, [displayStocks]);

  const visibleStocks = showAll ? displayStocks : displayStocks.slice(0, 3);
  const hasMore = displayStocks.length > 3;

  const handleSelectStock = (stock) => {
    const livePrice = liveQuotes[stock.symbol]?.current || stock.defaultPrice;
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      shares: formData.shares || '10',
      buyPrice: formData.buyPrice || String(livePrice),
    });
  };

  const handleAddStock = (e) => {
    e.preventDefault();
    setFormError('');

    const symbol = formData.symbol.trim().toUpperCase();
    const name = formData.name.trim() || symbol;
    const shares = parseFloat(formData.shares);
    const buyPrice = parseFloat(formData.buyPrice);

    if (!symbol) {
      setFormError('Please select a stock.');
      return;
    }
    if (isNaN(shares) || shares <= 0) {
      setFormError('Shares must be greater than 0.');
      return;
    }
    if (isNaN(buyPrice) || buyPrice <= 0) {
      setFormError('Buy price must be greater than 0.');
      return;
    }

    // Check if already in portfolio
    if (stocks.some(s => s.symbol === symbol)) {
      setFormError(`${symbol} is already in your portfolio.`);
      return;
    }

    const currentPrice = liveQuotes[symbol]?.current || buyPrice;

    const newStock = {
      id: Date.now().toString(),
      symbol,
      name,
      shares,
      buyPrice,
      currentPrice,
      addedAt: new Date().toISOString(),
    };

    setStocks(prev => [newStock, ...prev]);
    setFormData({ symbol: '', name: '', shares: '', buyPrice: '' });
    setShowAddForm(false);
    fetchQuotesForSymbols([symbol]);
  };

  const handleDeleteStock = (id) => {
    setStocks(prev => prev.filter(s => s.id !== id));
  };

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <SectionTitle
        badge={stocks.length > 0 ? `${stocks.length} Holding${stocks.length > 1 ? 's' : ''}` : undefined}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Leaderboard Button */}
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: showLeaderboard ? '#f1f5f9' : '#6366f1',
                color: showLeaderboard ? '#334155' : '#fff',
                border: 'none',
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              title="View all stocks leaderboard"
            >
              🏆 Leaderboard
            </button>
            {/* Live Prices Button */}
            {stocks.length > 0 && (
              <button
                onClick={handleRefreshPrices}
                disabled={liveLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: liveLoading ? '#f1f5f9' : '#10b981',
                  color: liveLoading ? '#64748b' : '#fff',
                  border: 'none',
                  padding: '7px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: liveLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
                title="Fetch live prices from API"
              >
                {liveLoading ? '⟳ Loading...' : '🔄 Live Prices'}
              </button>
            )}
            {/* Add Stock Button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: showAddForm ? '#f1f5f9' : 'var(--primary, #2563eb)',
                color: showAddForm ? '#334155' : '#fff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {showAddForm ? '✕ Close' : '➕ Add Stock'}
            </button>
          </div>
        }
      >
        📈 My Invested Stocks
      </SectionTitle>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowLeaderboard(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>🏆 Stock Market Leaderboard</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Live Indian equities powered by API</p>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {POPULAR_STOCKS.map((p, idx) => {
                const quote = liveQuotes[p.symbol];
                const price = quote?.current || p.defaultPrice;
                const changePct = quote?.changePercent;
                const isPositive = changePct ? changePct >= 0 : true;

                return (
                  <button
                    key={p.symbol}
                    onClick={() => {
                      handleSelectStock(p);
                      setShowLeaderboard(false);
                      setShowAddForm(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: idx < 3 ? '#fef3c7' : '#dbeafe',
                        color: idx < 3 ? '#b45309' : '#1d4ed8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 12,
                      }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a' }}>{p.symbol}</strong>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{p.name}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {formatCurrency(price)}
                      </div>
                      {changePct !== undefined && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: isPositive ? '#16a34a' : '#dc2626' }}>
                          {isPositive ? '▲ +' : '▼ '}{changePct.toFixed(2)}%
                        </div>
                      )}
                      <span style={{
                        display: 'inline-block',
                        marginTop: 2,
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#2563eb',
                      }}>
                        + Add to Portfolio
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live Status Indicators */}
      {liveError && (
        <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>
          ⚠️ {liveError}
        </div>
      )}

      {lastUpdated && (
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
          Live API updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Add Stock Form - Clickable Selection Only */}
      {showAddForm && (
        <form
          onSubmit={handleAddStock}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '18px',
            marginBottom: 20,
          }}
        >
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
            Add an Invested Stock
          </p>

          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              Select a Stock (click to choose):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POPULAR_STOCKS.map(p => (
                <button
                  type="button"
                  key={p.symbol}
                  onClick={() => handleSelectStock(p)}
                  disabled={stocks.some(s => s.symbol === p.symbol)}
                  style={{
                    padding: '8px 12px',
                    background: formData.symbol === p.symbol ? '#dbeafe' : (stocks.some(s => s.symbol === p.symbol) ? '#f1f5f9' : '#fff'),
                    border: `1px solid ${formData.symbol === p.symbol ? '#3b82f6' : (stocks.some(s => s.symbol === p.symbol) ? '#cbd5e1' : '#cbd5e1')}`,
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: formData.symbol === p.symbol ? '#1d4ed8' : (stocks.some(s => s.symbol === p.symbol) ? '#94a3b8' : '#334155'),
                    cursor: stocks.some(s => s.symbol === p.symbol) ? 'not-allowed' : 'pointer',
                    opacity: stocks.some(s => s.symbol === p.symbol) ? 0.6 : 1,
                  }}
                >
                  {p.symbol}
                  {stocks.some(s => s.symbol === p.symbol) && ' ✓'}
                </button>
              ))}
            </div>
            {formData.symbol && (
              <p style={{ margin: '8px 0 0', fontSize: 11, color: '#10b981' }}>
                Selected: <strong>{formData.symbol}</strong> — {POPULAR_STOCKS.find(p => p.symbol === formData.symbol)?.name || ''}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Shares / Qty</label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 15"
                value={formData.shares}
                onChange={e => setFormData({ ...formData, shares: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Buy Price (₹)</label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 3400"
                value={formData.buyPrice}
                onChange={e => setFormData({ ...formData, buyPrice: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              />
            </div>
          </div>

          {formError && (
            <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8 }}>⚠️ {formError}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12.5, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--primary, #2563eb)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Save Holding
            </button>
          </div>
        </form>
      )}

      {stocks.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No Invested Stocks Yet"
          hint="You haven't added any stocks to your personal portfolio. Click 'Add Stock' above or below to track your holdings with live API prices."
          cta="➕ Add Stock"
          onCtaClick={() => setShowAddForm(true)}
        />
      ) : (
        <>
          {/* Portfolio Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            marginBottom: 16,
          }}>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Value</span>
              <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{formatCurrency(portfolioMetrics.totalCurrent)}</p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Invested</span>
              <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#475569' }}>{formatCurrency(portfolioMetrics.totalInvested)}</p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Returns</span>
              <p style={{
                margin: '2px 0 0',
                fontSize: 16,
                fontWeight: 800,
                color: portfolioMetrics.totalPnl >= 0 ? '#16a34a' : '#dc2626',
              }}>
                {portfolioMetrics.totalPnl >= 0 ? '▲ +' : '▼ '}
                {formatCurrency(Math.abs(portfolioMetrics.totalPnl))} ({portfolioMetrics.pnlPercent.toFixed(2)}%)
              </p>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Holdings</span>
              <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                {portfolioMetrics.count} {portfolioMetrics.count === 1 ? 'Stock' : 'Stocks'}
              </p>
            </div>
          </div>

          {/* Stock List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleStocks.map(s => {
              const qty = Number(s.shares) || 0;
              const buy = Number(s.buyPrice) || 0;
              const cur = Number(s.currentPrice) || buy;
              const totalVal = qty * cur;
              const investedVal = qty * buy;
              const pnl = totalVal - investedVal;
              const pnlPct = investedVal > 0 ? (pnl / investedVal) * 100 : 0;
              const isProfit = pnl >= 0;

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{s.symbol}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{qty} shares</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }}>{s.name}</div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 90 }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Buy @ {formatCurrency(buy)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                      Now {formatCurrency(cur)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 100 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      {formatCurrency(totalVal)}
                    </div>
                    <div style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: isProfit ? '#16a34a' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 2,
                    }}>
                      {isProfit ? '▲ +' : '▼ '}{formatCurrency(pnl)} ({pnlPct.toFixed(2)}%)
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteStock(s.id)}
                    title="Remove stock"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: 14,
                      borderRadius: 4,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                  >
                    🗑️
                  </button>
                </div>
              );
            })}

            {/* Show All / Show Less Button */}
            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                {showAll ? 'Show Less' : `Show All ${displayStocks.length} Holdings`}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function EmiCalculatorWidget({ onSaveAsReminder }) {
  const [principal, setPrincipal] = useState(1500000); // 15 Lakh default
  const [rate, setRate] = useState(8.5); // 8.5% p.a.
  const [tenureYears, setTenureYears] = useState(5); // 5 years

  // Calculate EMI
  const emiCalculation = useMemo(() => {
    const P = Number(principal) || 0;
    const annualR = Number(rate) || 0;
    const months = (Number(tenureYears) || 1) * 12;

    if (P <= 0 || annualR <= 0 || months <= 0) {
      return { emi: 0, totalPayment: 0, totalInterest: 0, months };
    }

    const r = annualR / 12 / 100;
    const emi = Math.round((P * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
    const totalPayment = emi * months;
    const totalInterest = Math.max(0, totalPayment - P);

    return {
      emi,
      totalPayment,
      totalInterest,
      principal: P,
      months,
      principalPct: Math.round((P / totalPayment) * 100) || 0,
      interestPct: Math.round((totalInterest / totalPayment) * 100) || 0,
    };
  }, [principal, rate, tenureYears]);

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <SectionTitle
        badge="Live Calculator"
        action={
          <Link
            to="/moneyplan"
            style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--primary, #2563eb)', textDecoration: 'none' }}
          >
            Amortization & What-If →
          </Link>
        }
      >
        🏦 EMI Calculator
      </SectionTitle>

      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
        Calculate monthly installments, interest burden, and total repayment.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Controls */}
        <div>
          {/* Loan Amount */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Loan Amount</label>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary, #2563eb)' }}>
                {formatCurrency(principal)}
              </span>
            </div>
            <input
              type="range"
              min={50000}
              max={10000000}
              step={25000}
              value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary, #2563eb)' }}
            />
            {/* Quick chips */}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {[500000, 1500000, 3000000, 5000000].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setPrincipal(val)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: principal === val ? '#e0e7ff' : '#f1f5f9',
                    color: principal === val ? '#3730a3' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ₹{val / 100000}L
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Interest Rate (p.a.)</label>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary, #2563eb)' }}>
                {rate}%
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={22}
              step={0.25}
              value={rate}
              onChange={e => setRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary, #2563eb)' }}
            />
            {/* Quick presets */}
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {[
                { label: 'Home (8.5%)', val: 8.5 },
                { label: 'Car (10.5%)', val: 10.5 },
                { label: 'Personal (13%)', val: 13 },
              ].map(item => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setRate(item.val)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: rate === item.val ? '#e0e7ff' : '#f1f5f9',
                    color: rate === item.val ? '#3730a3' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tenure */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Tenure</label>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary, #2563eb)' }}>
                {tenureYears} Years ({tenureYears * 12} mos)
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={tenureYears}
              onChange={e => setTenureYears(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary, #2563eb)' }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {[1, 3, 5, 10, 20].map(y => (
                <button
                  type="button"
                  key={y}
                  onClick={() => setTenureYears(y)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: tenureYears === y ? '#e0e7ff' : '#f1f5f9',
                    color: tenureYears === y ? '#3730a3' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {y} {y === 1 ? 'Year' : 'Years'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Monthly EMI Payment
            </span>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary, #2563eb)', marginTop: 4, letterSpacing: '-0.03em' }}>
              {formatCurrency(emiCalculation.emi)}
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>/ month</span>
            </div>

            {/* Split Breakdown */}
            <div style={{ marginTop: 18, display: 'grid', gap: 8, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Principal Amount</span>
                <strong style={{ color: '#0f172a' }}>{formatCurrency(principal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>Total Interest Payable</span>
                <strong style={{ color: '#d97706' }}>{formatCurrency(emiCalculation.totalInterest)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600 }}>Total Payment (P + I)</span>
                <strong style={{ color: '#0f172a' }}>{formatCurrency(emiCalculation.totalPayment)}</strong>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                <span>Principal ({emiCalculation.principalPct}%)</span>
                <span>Interest ({emiCalculation.interestPct}%)</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#f59e0b', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${emiCalculation.principalPct}%`, background: 'var(--primary, #2563eb)', height: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              onClick={() => onSaveAsReminder && onSaveAsReminder({
                title: `${formatCurrency(principal)} Loan`,
                amount: emiCalculation.emi,
                principal,
                rate,
                tenureYears,
                dueDay: 5,
              })}
              style={{
                width: '100%',
                padding: '9px 14px',
                background: '#1e293b',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              🔔 Save as EMI Reminder
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 3. EMI REMINDER WIDGET ───────────────────────────────────────────────────
/**
 * EMI Reminder Widget:
 * Displays scheduled EMI due dates, countdowns, and mark as paid.
 * Shows default empty message when none are scheduled.
 */
function EmiReminderWidget({ user, newReminderEvent }) {
  const storageKey = `finbuddy_emi_${user?.id || 'guest'}`;

  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', dueDay: '5' });

  // Handle reminder passed from EMI calculator
  useEffect(() => {
    if (newReminderEvent) {
      setReminders(prev => {
        const item = {
          id: Date.now().toString(),
          title: newReminderEvent.title || 'Loan EMI',
          amount: Number(newReminderEvent.amount) || 0,
          dueDay: Number(newReminderEvent.dueDay) || 5,
          paidMonths: [],
          addedAt: new Date().toISOString(),
        };
        return [item, ...prev];
      });
    }
  }, [newReminderEvent]);

  // Persist reminders
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reminders));
    } catch (err) {
      console.warn('Could not persist reminders:', err);
    }
  }, [reminders, storageKey]);

  const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

  const handleAddReminder = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    const dueDay = parseInt(formData.dueDay, 10);
    const title = formData.title.trim() || 'Loan EMI';

    if (isNaN(amount) || amount <= 0) return;

    const item = {
      id: Date.now().toString(),
      title,
      amount,
      dueDay: isNaN(dueDay) ? 5 : Math.max(1, Math.min(31, dueDay)),
      paidMonths: [],
      addedAt: new Date().toISOString(),
    };

    setReminders(prev => [item, ...prev]);
    setFormData({ title: '', amount: '', dueDay: '5' });
    setShowAddForm(false);
  };

  const handleTogglePaid = (id) => {
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      const isPaid = (r.paidMonths || []).includes(currentMonthKey);
      const updatedMonths = isPaid
        ? (r.paidMonths || []).filter(m => m !== currentMonthKey)
        : [...(r.paidMonths || []), currentMonthKey];
      return { ...r, paidMonths: updatedMonths };
    }));
  };

  const handleDeleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const totalMonthlyCommitment = useMemo(() => {
    return reminders.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [reminders]);

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <SectionTitle
        badge={reminders.length > 0 ? `${formatCurrency(totalMonthlyCommitment)}/mo` : null}
        action={
          <button
            onClick={() => setShowAddForm(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: showAddForm ? '#f1f5f9' : '#059669',
              color: showAddForm ? '#334155' : '#fff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showAddForm ? '✕ Close' : '➕ Add Reminder'}
          </button>
        }
      >
        ⏰ EMI Reminders & Dues
      </SectionTitle>

      {/* Inline Form to add reminder */}
      {showAddForm && (
        <form
          onSubmit={handleAddReminder}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 18,
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
            Set a New Loan EMI Reminder
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Loan Title</label>
              <input
                type="text"
                placeholder="e.g. Home Loan - HDFC"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Monthly Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 24500"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Due Day of Month</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="e.g. 5"
                value={formData.dueDay}
                onChange={e => setFormData({ ...formData, dueDay: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12.5, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#059669', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Save Reminder
            </button>
          </div>
        </form>
      )}

      {/* Default message when no reminders are saved */}
      {reminders.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No Active EMI Reminders"
          hint="Keep track of your monthly loan installments and avoid late penalty charges. Use the EMI Calculator above to save a reminder or add one manually."
          cta="➕ Add EMI Reminder"
          onCtaClick={() => setShowAddForm(true)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reminders.map(rem => {
            const isPaid = (rem.paidMonths || []).includes(currentMonthKey);
            const today = new Date().getDate();
            const dueDay = rem.dueDay || 5;
            const daysLeft = dueDay >= today ? dueDay - today : 30 - (today - dueDay);

            return (
              <div
                key={rem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: isPaid ? '#f0fdf4' : '#fff',
                  border: `1px solid ${isPaid ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: 12,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 24 }}>{isPaid ? '✅' : '🏦'}</span>
                  <div>
                    <strong style={{ fontSize: 14.5, color: '#0f172a' }}>{rem.title}</strong>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Due on {dueDay}th of each month · {isPaid ? 'Paid this month' : `Due in ~${daysLeft} days`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                      {formatCurrency(rem.amount)}
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: isPaid ? '#dcfce7' : daysLeft <= 3 ? '#fee2e2' : '#e0e7ff',
                      color: isPaid ? '#15803d' : daysLeft <= 3 ? '#b91c1c' : '#3730a3',
                    }}>
                      {isPaid ? 'Paid' : daysLeft <= 3 ? 'Due Soon' : 'Upcoming'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleTogglePaid(rem.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: `1px solid ${isPaid ? '#86efac' : '#cbd5e1'}`,
                      background: isPaid ? '#fff' : '#059669',
                      color: isPaid ? '#15803d' : '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isPaid ? 'Mark Unpaid' : 'Mark as Paid'}
                  </button>

                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    title="Remove reminder"
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── 4. RECOMMENDED STEPS IN THE RIGHT SIDE ───────────────────────────────────
/**
 * Prominently rendered in the right-side column of the landing page.
 * Action-oriented next steps tailored to user documents and goals.
 */
function RecommendedStepsSection({ lang, docCount = 0 }) {
  const { data } = useHomeSection(getNextSteps);

  // Default high-impact recommendations
  const defaultSteps = [
    {
      id: 'step-doc',
      icon: '📄',
      title: 'Upload Latest Payslip or Offer',
      description: 'Audit deductions, HRA exemptions, and verify salary components.',
      route: '/documents',
      badge: docCount > 0 ? 'Verified' : 'High Priority',
      badgeColor: docCount > 0 ? '#16a34a' : '#ea580c',
    },
    {
      id: 'step-tax',
      icon: '⚖️',
      title: 'Compare Old vs New Tax Regime',
      description: 'Find out whether standard or itemized 80C deductions save more.',
      route: '/salarytax',
      badge: 'Recommended',
      badgeColor: '#2563eb',
    },
    {
      id: 'step-offers',
      icon: '💼',
      title: 'Review Job Offer & Clause Traps',
      description: 'Check for non-compete clauses, notice period penalties & vesting.',
      route: '/offers',
      badge: 'Insights',
      badgeColor: '#7c3aed',
    },
    {
      id: 'step-ai',
      icon: '💬',
      title: 'Ask Fin-Buddy AI or CA Expert',
      description: 'Get instant explanations on Form 16, ESOPs, and tax questions.',
      route: '/assistant',
      badge: 'AI Assistant',
      badgeColor: '#059669',
    },
    {
      id: 'step-money',
      icon: '🎯',
      title: 'Plan Savings & Loan Prepayment',
      description: 'Simulate early loan pay-off versus equity SIP investing.',
      route: '/moneyplan',
      badge: 'Wealth Goal',
      badgeColor: '#d97706',
    },
  ];

  const steps = data?.steps?.length ? data.steps.map((s, idx) => ({
    ...s,
    badge: s.badge || (idx === 0 ? 'Priority' : 'Action'),
    badgeColor: idx === 0 ? '#ea580c' : '#2563eb',
  })) : defaultSteps;

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary, #2563eb)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Action Plan
          </span>
          <h2 style={{ margin: '4px 0 0', fontSize: 19, fontWeight: 800, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.02em' }}>
            🎯 Recommended Steps
          </h2>
        </div>
        <span style={{
          padding: '3px 10px',
          background: '#f0fdf4',
          color: '#15803d',
          border: '1px solid #bbf7d0',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
        }}>
          Tailored For You
        </span>
      </div>

      <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--text-secondary, #64748b)', lineHeight: 1.5 }}>
        Follow these steps to optimize your net salary, maximize tax savings, and secure your financial goals.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map(step => (
          <Link
            key={step.id}
            to={step.route}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = 'var(--primary, #2563eb)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.08)';
              e.currentTarget.style.transform = 'translateX(3px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{step.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{step.title}</p>
                {step.badge && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: `${step.badgeColor || '#2563eb'}18`,
                    color: step.badgeColor || '#2563eb',
                  }}>
                    {step.badge}
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.4 }}>{step.description}</p>
            </div>
            <span style={{ color: 'var(--primary, #2563eb)', fontSize: 16, flexShrink: 0, fontWeight: 700 }}>→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Financial Health Score Component ─────────────────────────────────────────

function FinancialHealthGraph({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getFinancialHealthScore);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const result = data?.data;
  const score = Number(result?.score) || 72;
  const scoreColor = score >= 70 ? '#16a34a' : score >= 40 ? '#d97706' : '#dc2626';
  const scoreLabel = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Needs attention';
  const factors = [
    ['Savings rate', result?.breakdown?.savingsRateScore || 75],
    ['Debt burden', result?.breakdown?.debtScore || 68],
    ['Emergency fund', result?.breakdown?.emergencyFundScore || 70],
    ['Expenses ratio', result?.breakdown?.expensesScore || 74],
  ];

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ margin: 0, color: 'var(--text-muted, #64748b)', fontSize: 11, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Financial Health
          </p>
          <h2 style={{ margin: '4px 0 0', fontSize: 19, fontWeight: 800, color: 'var(--text-main, #1e293b)', letterSpacing: '-0.02em' }}>
            Score Breakdown
          </h2>
        </div>
        <div style={{
          width: 82,
          height: 82,
          borderRadius: '50%',
          background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #f1f5f9 0deg)`,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <strong style={{ color: scoreColor, fontSize: 22, lineHeight: 1 }}>{score}</strong>
            <span style={{ color: '#94a3b8', fontSize: 9.5 }}>/ 100</span>
          </div>
        </div>
      </div>

      <p style={{ margin: '12px 0 14px', color: scoreColor, fontSize: 13, fontWeight: 750 }}>
        Status: {scoreLabel}
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {factors.map(([label, value]) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: '#475569' }}>
              <span>{label}</span><strong style={{ color: '#0f172a' }}>{value}/100</strong>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ width: `${Number(value) || 0}%`, height: '100%', borderRadius: 99, background: scoreColor }} />
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/moneyplan"
        style={{ display: 'inline-block', marginTop: 16, fontSize: 12.5, fontWeight: 700, color: 'var(--primary, #2563eb)', textDecoration: 'none' }}
      >
        Optimize health score in Money Plan →
      </Link>
    </section>
  );
}

// ── Savings Goals Section ────────────────────────────────────────────────────

function SavingsGoalsSection({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getSavingsGoals);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const goals = data?.data || [];
  const activeGoals = goals
    .filter((g) => Number(g.targetAmount) > 0)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
  const goal = activeGoals[0];

  if (!goal) {
    return (
      <section style={{
        background: '#fff',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '24px',
        boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
      }}>
        <SectionTitle>🎯 Savings Goals</SectionTitle>
        <EmptyState
          icon="🎯"
          title="Turn a plan into progress"
          hint="Set an emergency fund, home, travel, or purchase goal and track it here."
          cta="Create a savings goal"
          ctaHref="/moneyplan"
        />
      </section>
    );
  }

  const target = Number(goal.targetAmount);
  const saved = Math.min(target, Math.max(0, Number(goal.currentSavings) || 0));
  const progress = Math.min(100, Math.round((saved / target) * 100));
  const monthsRemaining = Math.max(1, Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30.44)));
  const monthlyNeeded = Math.ceil(Math.max(0, target - saved) / monthsRemaining);

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <SectionTitle>🎯 Savings Goals</SectionTitle>
        <Link to="/moneyplan" style={{ color: 'var(--primary, #2563eb)', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
          View all →
        </Link>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 750, color: '#0f172a' }}>{goal.title}</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
              Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span style={{ color: 'var(--primary, #2563eb)', fontWeight: 800, fontSize: 17 }}>{progress}%</span>
        </div>
        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, margin: '14px 0 10px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: 999, transition: 'width 0.35s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#475569', gap: 12 }}>
          <span><strong>{formatCurrency(saved)}</strong> of {formatCurrency(target)}</span>
          <span>{activeGoals.length > 1 ? `+${activeGoals.length - 1} more` : 'On track'}</span>
        </div>
        <div style={{ marginTop: 14, padding: '10px 12px', background: '#eff6ff', borderRadius: 8, color: '#1e40af', fontSize: 12 }}>
          Save <strong>{formatCurrency(monthlyNeeded)}/month</strong> to reach this goal on time.
        </div>
      </div>
    </section>
  );
}

// ── Overview & Activity Sections ─────────────────────────────────────────────

function OverviewSection({ lang, data }) {
  const docs = data?.documents || { total: 0, offer_letter: 0, payslip: 0 };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 14,
      marginBottom: 28,
    }}>
      {[
        { label: 'Documents Uploaded', value: docs.total, icon: '📁', color: '#4f46e5' },
        { label: 'Offer Letters Audited', value: docs.offer_letter, icon: '📄', color: '#059669' },
        { label: 'Payslips Verified', value: docs.payslip, icon: '🧾', color: '#d97706' },
      ].map(card => (
        <div key={card.label} style={{
          background: '#fff',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          borderRadius: 14,
          padding: '16px 20px',
          boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>{card.icon}</span>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, letterSpacing: '-0.04em' }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', fontWeight: 500, marginTop: 2 }}>
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineSection({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getTimeline);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const events = data?.events || [];

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <SectionTitle>{t(lang, 'timelineTitle')}</SectionTitle>
      {events.length === 0 ? (
        <EmptyState
          icon="📅"
          title={t(lang, 'timelineEmpty')}
          hint={t(lang, 'timelineEmptyHint')}
          cta="Upload Document"
          ctaHref="/documents"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: 24 }}>
          <div style={{
            position: 'absolute', left: 8, top: 8, bottom: 8,
            width: 2, background: 'linear-gradient(180deg, var(--primary, #2563eb), #cbd5e1)',
            borderRadius: 2,
          }} />
          {events.slice(0, 5).map((ev, i) => (
            <div key={ev.id || i} style={{ display: 'flex', gap: 12, marginBottom: 16, position: 'relative' }}>
              <div style={{
                position: 'absolute', left: -24, top: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', border: '2px solid var(--primary, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9,
              }}>
                {ev.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: 13.5 }}>{ev.title}</p>
                {ev.description && (
                  <p style={{ margin: '1px 0 0', color: '#64748b', fontSize: 12 }}>{ev.description}</p>
                )}
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 11 }}>
                  {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ActivitySection({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getActivity);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const items = data?.activity || [];

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <SectionTitle>{t(lang, 'activityTitle')}</SectionTitle>
      {items.length === 0 ? (
        <EmptyState
          icon="🕐"
          title={t(lang, 'activityEmpty')}
          hint={t(lang, 'activityEmptyHint')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.slice(0, 5).map((item, i) => (
            <div key={item.id || i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #f1f5f9',
            }}>
              <span style={{ fontSize: 18 }}>
                {item.type === 'offer_letter' ? '📄' : item.type === 'payslip' ? '🧾' : '📁'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{item.label}</p>
                {item.fileName && (
                  <p style={{ margin: '1px 0 0', color: '#64748b', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.fileName}
                  </p>
                )}
              </div>
              <span style={{ color: '#94a3b8', fontSize: 11.5 }}>
                {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── MAIN LANDING PAGE COMPONENT ──────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();
  const { lang, depth } = useSettings();

  const { data: overviewData } = useHomeSection(getOverview);
  const [createdReminder, setCreatedReminder] = useState(null);

  const docCount = overviewData?.documents?.total || 0;
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '28px 24px 64px',
    }}>

      {/* ── Welcome Hero Banner ────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)',
        borderRadius: 'var(--radius-lg, 18px)',
        padding: '28px 32px',
        marginBottom: 28,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 30px rgba(30,27,75,0.3)',
      }}>
        <div>
          <span style={{
            display: 'inline-block',
            padding: '3px 12px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            marginBottom: 8,
          }}>
            🇮🇳 Fin-Buddy Financial Intelligence
          </span>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {t(lang, 'welcomeBack')}, {user?.name || 'Explorer'} 👋
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', maxWidth: 520, lineHeight: 1.5 }}>
            Here is your live financial snapshot — manage your personal stock investments, compute loan EMIs, set installment reminders, and follow your action plan.
          </p>
          {joinDate && (
            <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
              {t(lang, 'memberSince')} {joinDate}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/documents"
            style={{
              padding: '9px 18px',
              background: '#fff',
              color: '#1e1b4b',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            📄 Upload Document
          </Link>
          <Link
            to="/assistant"
            style={{
              padding: '9px 18px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.3)',
            }}
          >
            💬 Ask Fin-Buddy AI
          </Link>
        </div>
      </div>

      {/* ── Document Quick Metrics ────────────────────────────────────────── */}
      <OverviewSection lang={lang} data={overviewData} />

      {/* ── MAIN 2-COLUMN DASHBOARD LAYOUT ─────────────────────────────────── */}
      {/* Left Column: User Invested Stocks, EMI Calculator, EMI Reminders       */}
      {/* Right Column: Recommended Steps (at top), Financial Health, Goals      */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)',
        gap: 28,
        alignItems: 'start',
      }}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* 1. USER STOCK WIDGET (Shows ONLY invested stocks, default message when none) */}
          <InvestedStocksWidget user={user} />

          {/* 2. EMI CALCULATOR WIDGET (Interactive live loan calculator) */}
          <EmiCalculatorWidget onSaveAsReminder={(rem) => setCreatedReminder(rem)} />

          {/* 3. EMI REMINDER WIDGET (Scheduled loan dues & reminder alerts) */}
          <EmiReminderWidget user={user} newReminderEvent={createdReminder} />

        </div>

        {/* ── RIGHT COLUMN: RECOMMENDED STEPS IN THE RIGHT SIDE ───────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* 4. RECOMMENDED STEPS (Prominent right-side placement) */}
          <RecommendedStepsSection lang={lang} docCount={docCount} />

          {/* Financial Health Score Breakdown */}
          <FinancialHealthGraph lang={lang} />

          {/* Savings Goals */}
          <SavingsGoalsSection lang={lang} />

        </div>

      </div>

      {/* ── BOTTOM GRID: TIMELINE & ACTIVITY ───────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 28,
        marginTop: 36,
      }}>
        <TimelineSection lang={lang} />
        <ActivitySection lang={lang} />
      </div>

      {/* Pulse Keyframe Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>

    </div>
  );
}
