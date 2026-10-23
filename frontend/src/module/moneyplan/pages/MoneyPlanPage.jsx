/**
 * Money Plan Page — P2 Module
 * 4 tabs: Health Score | Goals | EMI Calculator | Regret Simulator
 */
import React, { useState, useEffect } from 'react';
import {
  getHealthScore,
  getGoals,
  createGoal,
  calcEmi,
  regretSimulator,
} from '../services/moneyplanApi';

const fmt = (n) =>
  typeof n === 'number' ? '₹' + Math.round(n).toLocaleString('en-IN') : n;

const TABS = ['🏥 Health Score', '🎯 Goals', '🏦 EMI Calculator', '⏰ Regret Simulator'];

// ── Shared UI ────────────────────────────────────────────────
function Label({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
      {children}
    </label>
  );
}

function Input({ label, value, onChange, type = 'number', min = 0, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <Label>{label}</Label>}
      <input
        type={type} value={value} min={min} placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--border-subtle)', fontSize: 14,
          background: '#fff', color: 'var(--text-main)', outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
      />
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)', padding: '20px 24px',
      boxShadow: 'var(--shadow-sm)', ...style,
    }}>
      {children}
    </div>
  );
}

function ResultRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--primary)' : 'var(--text-main)' }}>{value}</span>
    </div>
  );
}

function Btn({ onClick, loading, children, style }) {
  return (
    <button onClick={onClick} disabled={loading} className="btn btn-primary"
      style={{ marginTop: 4, opacity: loading ? 0.7 : 1, ...style }}>
      {loading ? '⏳ Calculating…' : children}
    </button>
  );
}

function ErrorBox({ msg }) {
  return msg ? (
    <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>
      ⚠️ {msg}
    </div>
  ) : null;
}

function Disclaimer({ text }) {
  return <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>🛡️ {text}</p>;
}

// ── Tab 1: Health Score ──────────────────────────────────────
function HealthScoreTab() {
  const [params, setParams] = useState({ savingsRate: 0.2, debtBurden: 0.3, emergencyFundMonths: 6, expensesRatio: 0.5 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setParams((p) => ({ ...p, [k]: v }));

  const run = async () => {
    setLoading(true);
    try { setResult(await getHealthScore(params)); }
    finally { setLoading(false); }
  };

  useEffect(() => { run(); }, []); // auto-compute on load

  const scoreColor = (s) => s >= 70 ? 'var(--success)' : s >= 40 ? 'var(--warning)' : 'var(--danger)';
  const scoreLabel = (s) => s >= 70 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Attention';

  const FACTORS = [
    { key: 'savingsRate', label: 'Savings Rate', sub: `${Math.round(params.savingsRate * 100)}%`, min: 0, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%`, weight: '30%', tip: 'Higher is better. Target 20%+.' },
    { key: 'debtBurden', label: 'Debt Burden', sub: `${Math.round(params.debtBurden * 100)}% of income`, min: 0, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%`, weight: '30%', tip: 'Lower is better. Under 30% is healthy.' },
    { key: 'emergencyFundMonths', label: 'Emergency Fund', sub: `${params.emergencyFundMonths} months`, min: 0, max: 24, step: 0.5, fmt: (v) => `${v} mo`, weight: '20%', tip: 'Target 6+ months of expenses.' },
    { key: 'expensesRatio', label: 'Expenses Ratio', sub: `${Math.round(params.expensesRatio * 100)}% of income`, min: 0, max: 1, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%`, weight: '20%', tip: 'Lower is better. Under 50% is healthy.' },
  ];

  const breakdownKeys = result?.data?.breakdown
    ? Object.entries(result.data.breakdown)
    : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 700 }}>Adjust Your Financial Parameters</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Sliders update your score instantly</p>
        {FACTORS.map((f) => (
          <div key={f.key} style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Label>{f.label} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· weight {f.weight}</span></Label>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{f.fmt(params[f.key])}</span>
            </div>
            <input type="range" min={f.min} max={f.max} step={f.step} value={params[f.key]}
              onChange={(e) => { set(f.key)(Number(e.target.value)); setTimeout(run, 50); }}
              style={{ width: '100%', accentColor: 'var(--primary)' }} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>💡 {f.tip}</p>
          </div>
        ))}
        <Btn onClick={run} loading={loading}>Recalculate Score</Btn>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Your Financial Health Score</h3>
        {result ? (
          <>
            {/* Big score circle */}
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{
                width: 140, height: 140, borderRadius: '50%', margin: '0 auto 12px',
                background: `conic-gradient(${scoreColor(result.data.score)} ${result.data.score * 3.6}deg, var(--bg-subtle) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}>
                <div style={{ width: 110, height: 110, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: scoreColor(result.data.score) }}>{result.data.score}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: scoreColor(result.data.score) }}>{scoreLabel(result.data.score)}</div>
            </div>

            {/* Factor breakdown */}
            <div>
              {breakdownKeys.map(([key, val]) => {
                const labels = { savingsRateScore: 'Savings Rate', debtScore: 'Debt Burden', emergencyFundScore: 'Emergency Fund', expensesScore: 'Expenses' };
                return (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{labels[key] || key}</span>
                      <span style={{ fontWeight: 600, color: scoreColor(val) }}>{val}/100</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${val}%`, background: scoreColor(val), borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Disclaimer text="Score is a simple educational estimate, not a financial assessment." />
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>Loading…</p>
        )}
      </Card>
    </div>
  );
}

// ── Tab 2: Goals ─────────────────────────────────────────────
function GoalsTab() {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState({ title: '', targetAmount: 0, targetDate: '', currentSavings: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => { getGoals().then((r) => setGoals(r.data || [])); }, []);

  const add = async () => {
    setLoading(true); setError('');
    try {
      const r = await createGoal(form);
      setGoals((g) => [...g, r.data]);
      setForm({ title: '', targetAmount: 0, targetDate: '', currentSavings: 0 });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const monthlyNeeded = (g) => {
    const months = Math.max(1, Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
    return Math.round(Math.max(0, g.targetAmount - g.currentSavings) / months);
  };

  const progress = (g) => Math.min(100, Math.round((g.currentSavings / g.targetAmount) * 100));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Add a Financial Goal</h3>
        <Input label="Goal Name" value={form.title} onChange={set('title')} type="text" placeholder="e.g. Emergency Fund, House Down Payment" />
        <Input label="Target Amount (₹)" value={form.targetAmount} onChange={set('targetAmount')} />
        <Input label="Current Savings (₹)" value={form.currentSavings} onChange={set('currentSavings')} />
        <div style={{ marginBottom: 16 }}>
          <Label>Target Date</Label>
          <input type="date" value={form.targetDate} onChange={(e) => set('targetDate')(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-subtle)', fontSize: 14 }} />
        </div>
        <Btn onClick={add} loading={loading}>Add Goal</Btn>
        <ErrorBox msg={error} />
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>My Goals ({goals.length})</h3>
        {goals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginTop: 40 }}>No goals yet. Add your first goal!</p>
        ) : goals.map((g) => (
          <div key={g.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{g.title}</span>
              <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>{progress(g)}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 4, marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${progress(g)}%`, background: 'var(--primary)', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target</div><div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(g.targetAmount)}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saved</div><div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(g.currentSavings)}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Need/mo</div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{fmt(monthlyNeeded(g))}</div></div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>📅 Target: {g.targetDate}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Tab 3: EMI Calculator ────────────────────────────────────
function EmiTab() {
  const [form, setForm] = useState({ principal: 2000000, annualInterestRate: 8.5, tenureMonths: 240 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true); setError('');
    try { setResult(await calcEmi(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Loan Details</h3>
        <Input label="Loan Amount (₹)" value={form.principal} onChange={set('principal')} />
        <div style={{ marginBottom: 16 }}>
          <Label>Annual Interest Rate — {form.annualInterestRate}%</Label>
          <input type="range" min={5} max={24} step={0.25} value={form.annualInterestRate}
            onChange={(e) => set('annualInterestRate')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Label>Tenure — {form.tenureMonths} months ({Math.round(form.tenureMonths / 12)} years)</Label>
          <input type="range" min={12} max={360} step={12} value={form.tenureMonths}
            onChange={(e) => set('tenureMonths')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }} />
        </div>
        <Btn onClick={run} loading={loading}>Calculate EMI</Btn>
        <ErrorBox msg={error} />
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>EMI Breakdown</h3>
        {result ? (
          <>
            <div style={{ textAlign: 'center', padding: '20px 0', marginBottom: 16 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--primary)' }}>{fmt(result.emi)}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>per month</div>
            </div>
            <ResultRow label="Loan Amount" value={fmt(result.principal)} />
            <ResultRow label="Total Interest" value={fmt(result.totalInterest)} />
            <ResultRow label="Total Payment" value={fmt(result.totalPayment)} highlight />
            <ResultRow label="Tenure" value={`${result.tenureMonths} months`} />
            <ResultRow label="Rate" value={`${result.annualInterestRate}% p.a.`} />

            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', margin: '16px 0 8px' }}>First 12 Months Amortization</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map((h) => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.amortizationSample.map((r) => (
                    <tr key={r.month} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: 'var(--text-muted)' }}>{r.month}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right' }}>{fmt(r.emi)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: 'var(--success)' }}>{fmt(r.principalComp)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', color: 'var(--danger)' }}>{fmt(r.interestComp)}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600 }}>{fmt(r.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Disclaimer text={result.disclaimer} />
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 40, textAlign: 'center' }}>Adjust loan details and click Calculate EMI.</p>
        )}
      </Card>
    </div>
  );
}

// ── Tab 4: Regret Simulator ──────────────────────────────────
function RegretTab() {
  const [form, setForm] = useState({ monthlyAmount: 5000, yearsAgo: 5, annualReturnRate: 12, scenarioLabel: 'SIP in Index Fund' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true); setError('');
    try { setResult(await regretSimulator(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { run(); }, [form]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 700 }}>What If I Had Started Earlier?</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>See the compounding you missed — and why starting today matters</p>
        <div style={{ marginBottom: 16 }}>
          <Label>Scenario Name</Label>
          <select
            value={form.scenarioLabel}
            onChange={(e) => set('scenarioLabel')(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border-subtle)', fontSize: 14,
              background: '#fff', color: 'var(--text-main)', outline: 'none',
              cursor: 'pointer', appearance: 'auto',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
          >
            <option value="SIP in Index Fund">SIP in Index Fund</option>
            <option value="SIP in Mutual Funds">SIP in Mutual Funds</option>
            <option value="Gold Investment">Gold Investment</option>
            <option value="Fixed Deposit (FD)">Fixed Deposit (FD)</option>
            <option value="Recurring Deposit (RD)">Recurring Deposit (RD)</option>
            <option value="Savings Account">Savings Account</option>
          </select>
        </div>
        <Input label="Monthly Amount (₹)" value={form.monthlyAmount} onChange={set('monthlyAmount')} />
        <div style={{ marginBottom: 16 }}>
          <Label>Years Ago I Should Have Started — {form.yearsAgo} years</Label>
          <input type="range" min={1} max={30} step={1} value={form.yearsAgo}
            onChange={(e) => set('yearsAgo')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Label>Assumed Annual Return — {form.annualReturnRate}%</Label>
          <input type="range" min={4} max={20} step={0.5} value={form.annualReturnRate}
            onChange={(e) => set('annualReturnRate')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }} />
        </div>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>The Cost of Waiting</h3>
        {result ? (
          <>
            <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Wealth missed by not starting {result.yearsAgo} years ago</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--danger)' }}>{fmt(result.wealthMissed)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { l: 'Monthly SIP', v: fmt(result.monthlyAmount) },
                { l: 'Total Invested', v: fmt(result.totalInvested) },
                { l: 'Portfolio Value', v: fmt(result.portfolioValueIfStartedEarlier) },
                { l: 'Daily Cost of Waiting', v: fmt(result.equivalentDailyCost) },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>🌱 Good News!</div>
              <div style={{ fontSize: 13, color: 'var(--text-main)', marginTop: 4 }}>{result.encouragement}</div>
            </div>

            {result.assumptions.map((a, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>• {a}</p>
            ))}
            <Disclaimer text={result.disclaimer} />
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 40, textAlign: 'center' }}>Enter your scenario to see the impact.</p>
        )}
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
const COMPONENTS = [HealthScoreTab, GoalsTab, EmiTab, RegretTab];

export default function MoneyPlanPage() {
  const [tab, setTab] = useState(0);
  const TabContent = COMPONENTS[tab];

  return (
    <div className="app-container page-wrapper">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          📊 Money Plan
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
          Financial health score · Goals · Loans · Simulators
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13,
              fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === i ? 'var(--primary)' : 'var(--bg-subtle)',
              color: tab === i ? '#fff' : 'var(--text-secondary)',
              transition: 'var(--transition)',
            }}>
            {t}
          </button>
        ))}
      </div>

      <TabContent />

      <div style={{
        marginTop: 40, padding: '14px 18px',
        background: 'var(--warning-light)', border: '1px solid var(--warning-border)',
        borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--warning)',
      }}>
        🛡️ <strong>Educational estimates only.</strong> Investment returns shown are NOT guaranteed.
        Not SEBI-registered financial advice. Consult a financial advisor before making decisions.
      </div>
    </div>
  );
}
