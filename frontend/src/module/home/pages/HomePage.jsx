/**
 * Home Page — Fin-Buddy Authenticated Landing Dashboard
 * Displays ONLY what was requested:
 *  1. User Stock Widget (shows only stocks the user invested in, with default message when none)
 *  2. EMI Calculator Widget (interactive live loan calculations)
 *  3. EMI Reminder Widget (upcoming loan installments, reminders & status)
 *  4. Recommended Steps on the right side
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../components/AppLayout';
import { getNextSteps, getStockQuotes } from '../services/homeApi';
import { t } from '../i18n';

// ── Reusable Tiny Section Title ──────────────────────────────────────────────

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

const EmptyState = ({ icon = '📭', title, hint, cta, onCtaClick }) => (
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
    {hint && (
      <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: 13, maxWidth: 380, lineHeight: 1.5 }}>
        {hint}
      </p>
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

function formatCurrency(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
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
 * - Empty state when no stocks
 * - Shows max 3 stocks, "Show All" expands
 * - Leaderboard button in top bar
 * - Clickable stock selection (no typing)
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

  // Live price fetching state
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

  const handleRefreshPrices = async () => {
    if (!stocks.length) return;

    setLiveLoading(true);
    setLiveError('');

    try {
      const symbols = stocks.map(s => s.symbol);
      const response = await getStockQuotes(symbols);

      if (response.data) {
        setLiveQuotes(response.data);
        setLastUpdated(new Date());
      } else if (!response.available) {
        setLiveError(response.error || 'Live prices not available.');
      }
    } catch (err) {
      setLiveError(err.message || 'Failed to fetch live prices');
    } finally {
      setLiveLoading(false);
    }
  };

  // Merge live quotes into stocks for display
  const displayStocks = useMemo(() => {
    return stocks.map(s => {
      const quote = liveQuotes[s.symbol];
      if (quote && quote.current && !quote.error) {
        return { ...s, currentPrice: quote.current, liveChange: quote.change, liveChangePercent: quote.changePercent };
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
      totalCurrent += qty * (Number(s.currentPrice) || 0);
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

  // Stocks to display (max 3 unless showAll)
  const visibleStocks = showAll ? displayStocks : displayStocks.slice(0, 3);
  const hasMore = displayStocks.length > 3;

  const handleSelectStock = (stock) => {
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      shares: formData.shares || '10',
      buyPrice: formData.buyPrice || String(stock.defaultPrice),
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

    // Check if already added
    if (stocks.some(s => s.symbol === symbol)) {
      setFormError(`${symbol} is already in your portfolio.`);
      return;
    }

    const newStock = {
      id: Date.now().toString(),
      symbol,
      name,
      shares,
      buyPrice,
      currentPrice: buyPrice, // Will be updated on live refresh
      addedAt: new Date().toISOString(),
    };

    setStocks(prev => [newStock, ...prev]);
    setLiveQuotes({});
    setFormData({ symbol: '', name: '', shares: '', buyPrice: '' });
    setShowAddForm(false);
  };

  const handleDeleteStock = (id) => {
    setStocks(prev => prev.filter(s => s.id !== id));
    setLiveQuotes(prev => {
      const next = { ...prev };
      const deleted = stocks.find(s => s.id === id);
      if (deleted) delete next[deleted.symbol];
      return next;
    });
  };

  // Empty state
  if (stocks.length === 0) {
    return (
      <section style={{
        background: '#fff',
        border: '1px solid var(--border-subtle, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 16px)',
        padding: '24px',
        boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
      }}>
        <SectionTitle>
          📈 My Invested Stocks
        </SectionTitle>
        <EmptyState
          icon="📊"
          title="No Invested Stocks Yet"
          hint="You haven't added any stocks to your personal portfolio. Click 'Add Stock' to start tracking your investments."
          cta="➕ Add Stock"
          onCtaClick={() => setShowAddForm(true)}
        />
      </section>
    );
  }

  return (
    <section style={{
      background: '#fff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: 'var(--radius-lg, 16px)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
    }}>
      <SectionTitle
        badge={`${stocks.length} Holding${stocks.length > 1 ? 's' : ''}`}
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
              title="Fetch live prices"
            >
              {liveLoading ? '⟳ Loading...' : '🔄 Live Prices'}
            </button>
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
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>🏆 Stock Leaderboard</h3>
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
              {POPULAR_STOCKS.map((p, idx) => (
                <button
                  key={p.symbol}
                  onClick={() => { handleSelectStock(p); setShowLeaderboard(false); setShowAddForm(true); }}
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
                      background: '#dbeafe',
                      color: '#1d4ed8',
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
                  <span style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#10b981',
                  }}>+ Add</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {liveError && (
        <div style={{
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          color: '#be123c',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 16,
          fontSize: 12.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <span>⚠️ {liveError}</span>
          <button
            onClick={handleRefreshPrices}
            disabled={liveLoading}
            style={{
              padding: '4px 10px',
              background: '#fff',
              border: '1px solid #fda4af',
              borderRadius: 6,
              fontSize: 11.5,
              color: '#be123c',
              cursor: liveLoading ? 'not-allowed' : 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {lastUpdated && (
        <div style={{
          fontSize: 11,
          color: '#64748b',
          marginBottom: 16,
          textAlign: 'right',
        }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
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
              Select a Stock (click to add):
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
          <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Returns</span>
          <p style={{
            margin: '2px 0 0',
            fontSize: 16,
            fontWeight: 800,
            color: portfolioMetrics.totalPnl >= 0 ? '#16a34a' : '#dc2626',
          }}>
            {portfolioMetrics.totalPnl >= 0 ? '+' : ''}{formatCurrency(portfolioMetrics.totalPnl)} ({portfolioMetrics.pnlPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* List of invested stocks (max 3, expandable) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleStocks.map(s => {
          const qty = Number(s.shares) || 0;
          const buy = Number(s.buyPrice) || 0;
          const cur = Number(s.currentPrice) || buy;
          const invested = qty * buy;
          const currentVal = qty * cur;
          const pnl = currentVal - invested;
          const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
          const isProfit = pnl >= 0;
          const isLive = s.liveChange !== undefined;

          return (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#fff',
                border: '1px solid #f1f5f9',
                borderRadius: 10,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: isProfit ? '#dcfce7' : '#fee2e2',
                  color: isProfit ? '#15803d' : '#b91c1c',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                }}>
                  {s.symbol.slice(0, 3)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 14, color: '#0f172a' }}>{s.symbol}</strong>
                    <span style={{ fontSize: 11, color: '#64748b' }}>({s.name})</span>
                    {isLive && (
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        borderRadius: 999,
                        fontWeight: 700,
                      }}>LIVE</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {qty} shares @ {formatCurrency(buy)} avg
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(currentVal)}
                    {isLive && s.liveChange !== undefined && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginLeft: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: s.liveChange >= 0 ? '#16a34a' : '#dc2626',
                      }}>
                        {s.liveChange >= 0 ? '▲' : '▼'} {Math.abs(s.liveChange).toFixed(2)} ({s.liveChangePercent?.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12,
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
    </section>
  );
}