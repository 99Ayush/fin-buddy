/**
 * Home Page — Fin-Buddy Authenticated Dashboard
 * Displayed after login inside ProtectedRoute + AppLayout.
 * Reads real user data from the Home API. No fabricated financial figures.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useSettings } from '../../../components/AppLayout';
import {
  getOverview,
  getTimeline,
  getActivity,
  getNextSteps,
  getMarketMovers,
  getSavingsGoals,
  getFinancialHealthScore,
} from '../services/homeApi';
import { t } from '../i18n';

// ── Tiny reusable components ──────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <h2 style={{
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-main)',
    margin: '0 0 16px',
    letterSpacing: '-0.02em',
  }}>
    {children}
  </h2>
);

const EmptyState = ({ icon = '📭', title, hint, cta, ctaHref }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 24px',
    background: 'var(--bg-subtle)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--border-subtle)',
    textAlign: 'center',
    gap: 8,
  }}>
    <span style={{ fontSize: 36 }}>{icon}</span>
    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>{title}</p>
    {hint && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{hint}</p>}
    {cta && ctaHref && (
      <Link
        to={ctaHref}
        style={{
          marginTop: 8,
          padding: '8px 18px',
          background: 'var(--primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          fontSize: 13,
          textDecoration: 'none',
        }}
      >
        {cta}
      </Link>
    )}
  </div>
);

const LoadingCard = () => (
  <div style={{
    padding: 24,
    background: 'var(--bg-subtle)',
    borderRadius: 'var(--radius-md)',
    animation: 'pulse 1.4s ease-in-out infinite',
    minHeight: 80,
  }} />
);

const ErrorCard = ({ message, onRetry, lang }) => (
  <div style={{
    padding: 20,
    background: '#fff5f5',
    border: '1px solid #fecdd3',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  }}>
    <span style={{ color: '#be123c', fontSize: 14 }}>⚠️ {message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '6px 14px',
          background: '#be123c',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {t(lang, 'retry')}
      </button>
    )}
  </div>
);

// ── Custom hook: fetch a Home API section ─────────────────────────────────────

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

// ── Section components ────────────────────────────────────────────────────────

function OverviewSection({ lang, depth }) {
  const { data, loading, error, reload } = useHomeSection(getOverview);
  const { user } = useAuth();

  if (loading) return <LoadingCard />;
  if (error)   return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const docs = data?.documents || { total: 0, offer_letter: 0, payslip: 0 };

  return (
    <section>
      <SectionTitle>{t(lang, 'overviewTitle')}</SectionTitle>

      {/* Hint for depth */}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        {t(lang, depth)?.[`overviewHint`]}
      </p>

      {docs.total === 0 ? (
        <EmptyState
          icon="📊"
          title={t(lang, 'overviewEmpty')}
          hint={t(lang, 'overviewEmptyHint')}
          cta="Upload Document"
          ctaHref="/documents"
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
        }}>
          {[
            { label: t(lang, 'documentsUploaded'), value: docs.total,        icon: '📁', color: '#4f46e5' },
            { label: t(lang, 'offerLetters'),      value: docs.offer_letter, icon: '📄', color: '#059669' },
            { label: t(lang, 'payslips'),           value: docs.payslip,      icon: '🧾', color: '#d97706' },
          ].map(card => (
            <div key={card.label} style={{
              background: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              <span style={{ fontSize: 28 }}>{card.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: card.color, letterSpacing: '-0.04em' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NextStepsSection({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getNextSteps);

  if (loading) return <LoadingCard />;
  if (error)   return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const steps = data?.steps || [];

  return (
    <section>
      <SectionTitle>{t(lang, 'nextStepsTitle')}</SectionTitle>
      {steps.length === 0 ? (
        <EmptyState icon="✅" title={t(lang, 'nextStepsEmpty')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map(step => (
            <Link
              key={step.id}
              to={step.route}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xs)',
                textDecoration: 'none',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'none'; }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{step.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>{step.title}</p>
                <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 12.5 }}>{step.description}</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function formatCurrency(value) {
  return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;
}

function SavingsGoalsSection({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getSavingsGoals);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const goals = data?.data || [];
  const activeGoals = goals
    .filter((goal) => Number(goal.targetAmount) > 0)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
  const goal = activeGoals[0];

  if (!goal) {
    return (
      <section>
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
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <SectionTitle>🎯 Savings Goals</SectionTitle>
        <Link to="/moneyplan" style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          View all →
        </Link>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 750, color: 'var(--text-main)' }}>{goal.title}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: 18 }}>{progress}%</span>
        </div>
        <div style={{ height: 9, background: 'var(--bg-subtle)', borderRadius: 999, margin: '18px 0 10px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4f46e5, #818cf8)', borderRadius: 999, transition: 'width 0.35s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', gap: 12 }}>
          <span><strong style={{ color: 'var(--text-main)' }}>{formatCurrency(saved)}</strong> of {formatCurrency(target)}</span>
          <span>{activeGoals.length > 1 ? `+${activeGoals.length - 1} more` : 'On track'}</span>
        </div>
        <div style={{ marginTop: 16, padding: '10px 12px', background: '#eef2ff', borderRadius: 'var(--radius-sm)', color: '#3730a3', fontSize: 12.5 }}>
          Save <strong>{formatCurrency(monthlyNeeded)}/month</strong> to reach this goal on time.
        </div>
      </div>
    </section>
  );
}

function FinancialHealthGraph({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getFinancialHealthScore);

  if (loading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const result = data?.data;
  const score = Number(result?.score);
  const scoreColor = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  const scoreLabel = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Needs attention';
  const factors = [
    ['Savings rate', result?.breakdown?.savingsRateScore],
    ['Debt burden', result?.breakdown?.debtScore],
    ['Emergency fund', result?.breakdown?.emergencyFundScore],
    ['Expenses', result?.breakdown?.expensesScore],
  ];

  return (
    <section style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-xs)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Financial health</p>
          <h2 style={{ margin: '5px 0 0', fontSize: 20, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Score breakdown</h2>
        </div>
        <div style={{ width: 92, height: 92, borderRadius: '50%', background: `conic-gradient(${scoreColor} ${score * 3.6}deg, var(--bg-subtle) 0deg)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <strong style={{ color: scoreColor, fontSize: 24, lineHeight: 1 }}>{score}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>/ 100</span>
          </div>
        </div>
      </div>
      <p style={{ margin: '14px 0', color: scoreColor, fontSize: 13, fontWeight: 750 }}>{scoreLabel}</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {factors.map(([label, value]) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text-secondary)' }}>
              <span>{label}</span><strong style={{ color: 'var(--text-main)' }}>{value}/100</strong>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
              <div style={{ width: `${Number(value) || 0}%`, height: '100%', borderRadius: 99, background: scoreColor }} />
            </div>
          </div>
        ))}
      </div>
      <Link to="/moneyplan" style={{ display: 'inline-block', marginTop: 18, fontSize: 13, fontWeight: 750, color: 'var(--primary)', textDecoration: 'none' }}>
        Adjust health score inputs →
      </Link>
    </section>
  );
}

function EmiReminderCard() {
  return (
    <section style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', minHeight: 180, boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>EMI reminder</p>
        <h2 style={{ margin: '10px 0 6px', fontSize: 22, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>No loan tracked yet</h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' }}>Calculate an EMI to see your monthly payment and repayment breakdown.</p>
      </div>
      <Link to="/moneyplan" style={{ marginTop: 18, fontSize: 13, fontWeight: 750, color: 'var(--primary)', textDecoration: 'none' }}>Open EMI calculator →</Link>
    </section>
  );
}

function QuickActionCard({ icon, title, description, href, accent = '#4f46e5' }) {
  return (
    <Link to={href} style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px 20px', boxShadow: 'var(--shadow-xs)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 42, height: 42, borderRadius: 12, background: `${accent}16`, display: 'grid', placeItems: 'center', fontSize: 21, flexShrink: 0 }}>{icon}</span>
      <span>
        <span style={{ display: 'block', color: 'var(--text-main)', fontWeight: 750, fontSize: 14 }}>{title}</span>
        <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 3, lineHeight: 1.4 }}>{description}</span>
      </span>
    </Link>
  );
}

function TimelineSection({ lang }) {
  const { data, loading, error, reload } = useHomeSection(getTimeline);

  if (loading) return <LoadingCard />;
  if (error)   return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const events = data?.events || [];

  return (
    <section>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: 28 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 9, top: 12, bottom: 12,
            width: 2, background: 'linear-gradient(180deg, var(--primary), #a5b4fc)',
            borderRadius: 2,
          }} />
          {events.map((ev, i) => (
            <div key={ev.id || i} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -28, top: 4,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', border: '2px solid var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, flexShrink: 0,
              }}>
                {ev.icon}
              </div>
              <div style={{
                background: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                boxShadow: 'var(--shadow-xs)',
                flex: 1,
              }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>{ev.title}</p>
                {ev.description && (
                  <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: 12.5 }}>{ev.description}</p>
                )}
                <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 11.5, fontFamily: 'monospace' }}>
                  {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
  if (error)   return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const items = data?.activity || [];

  return (
    <section>
      <SectionTitle>{t(lang, 'activityTitle')}</SectionTitle>
      {items.length === 0 ? (
        <EmptyState
          icon="🕐"
          title={t(lang, 'activityEmpty')}
          hint={t(lang, 'activityEmptyHint')}
        />
      ) : (
        <div style={{
          background: '#fff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden',
        }}>
          {items.map((item, i) => (
            <div key={item.id || i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '12px 18px',
              borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>
                {item.type === 'offer_letter' ? '📄' : item.type === 'payslip' ? '🧾' : '📁'}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)', fontSize: 13.5 }}>{item.label}</p>
                {item.fileName && (
                  <p style={{ margin: '1px 0 0', color: 'var(--text-secondary)', fontSize: 12 }}>{item.fileName}</p>
                )}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0, fontFamily: 'monospace' }}>
                {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MarketMoversSection({ lang, depth }) {
  const { data, loading, error, reload } = useHomeSection(getMarketMovers);

  if (loading) return <LoadingCard />;
  if (error)   return <ErrorCard message={error} onRetry={reload} lang={lang} />;

  const movers = data?.movers || [];
  const isDemo = data?.dataSource === 'demo';

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <SectionTitle>{t(lang, 'marketMoversTitle')}</SectionTitle>
        <span style={{
          padding: '3px 10px',
          background: '#fff7ed',
          color: '#c2410c',
          border: '1px solid #fed7aa',
          borderRadius: 'var(--radius-full)',
          fontSize: 11,
          fontWeight: 700,
        }}>
          {t(lang, 'marketDisclaimerBadge')}
        </span>
        {isDemo && (
          <span style={{
            padding: '3px 10px',
            background: '#fef9c3',
            color: '#854d0e',
            border: '1px solid #fde047',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
            fontWeight: 700,
          }}>
            {t(lang, 'marketDemoLabel')}
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
        {t(lang, depth)?.[`marketHint`]}
      </p>

      {movers.length === 0 ? (
        <EmptyState icon="📉" title={t(lang, 'marketUnavailable')} />
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {movers.map(m => (
            <div key={m.symbol} style={{
              padding: '10px 16px',
              background: '#fff',
              border: `1px solid ${m.direction === 'up' ? '#a7f3d0' : '#fecdd3'}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 100,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                {m.symbol}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                {m.name}
              </span>
              <span style={{
                fontSize: 15,
                fontWeight: 800,
                color: m.direction === 'up' ? '#059669' : '#dc2626',
                marginTop: 6,
              }}>
                {m.change}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                {m.direction === 'up' ? '▲' : '▼'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer box */}
      <div style={{
        marginTop: 14,
        padding: '10px 14px',
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12,
        color: '#92400e',
        lineHeight: 1.55,
      }}>
        🛡️ {t(lang, 'marketDisclaimer')}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { user }         = useAuth();
  const { lang, depth }  = useSettings();

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 1120, margin: '0 auto', padding: '32px 24px 64px' }}>

      {/* ── Welcome banner ────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e40af 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: 32,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 8px 32px rgba(30,27,75,0.35)',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{t(lang, 'welcomeBack')}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
            {user?.name || '…'}
          </h1>
          {joinDate && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {t(lang, 'memberSince')} {joinDate}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/documents" style={{
            padding: '9px 20px', background: '#fff', color: '#312e81',
            borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, textDecoration: 'none',
          }}>
            📄 Documents
          </Link>
          <Link to="/offers" style={{
            padding: '9px 20px', background: 'rgba(255,255,255,0.15)',
            color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13,
            textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.3)',
          }}>
            💼 Offers
          </Link>
        </div>
      </div>

      {/* Dashboard layout: score and goals left, live monitoring right. */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)',
        gap: 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <FinancialHealthGraph lang={lang} />
          <SavingsGoalsSection lang={lang} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <MarketMoversSection lang={lang} depth={depth} />
          <EmiReminderCard />
        </div>
      </div>

      <section style={{ marginTop: 28 }}>
        <SectionTitle>Plan ahead</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <QuickActionCard icon="🏦" title="EMI Calculator" description="Estimate payments, total interest, and a repayment schedule." href="/moneyplan" accent="#d97706" />
          <QuickActionCard icon="🔁" title="What-If Planner" description="Compare prepaying versus investing and model your next financial move." href="/moneyplan" accent="#059669" />
          <QuickActionCard icon="📄" title="Review my documents" description="Upload an offer letter or payslip for a salary and clause review." href="/documents" accent="#2563eb" />
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, marginTop: 32 }}>
        <OverviewSection lang={lang} depth={depth} />
        <NextStepsSection lang={lang} />
        <TimelineSection lang={lang} />
        <ActivitySection lang={lang} />
      </div>

      {/* ── Global pulse animation ───────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
