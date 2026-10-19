/**
 * Salary & Tax Page — P2 Module
 * 5 tabs: In-hand | Payslip Audit | Regime Compare | Savings Gap | TDS
 */
import React, { useState } from 'react';
import {
  calculateInHand,
  regimeCompare,
  payslipAudit,
  savingsGap,
  tdsEstimate,
} from '../services/salarytaxApi';

const fmt = (n) =>
  typeof n === 'number'
    ? '₹' + Math.round(n).toLocaleString('en-IN')
    : n;

const TABS = ['💰 In-Hand', '📋 Payslip Audit', '⚖️ Regime Compare', '🎯 Savings Gap', '📊 TDS & Advance Tax'];

// ── Reusable components ──────────────────────────────────────

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
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        min={min}
        placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--border-subtle)', fontSize: 14,
          background: '#fff', color: 'var(--text-main)',
          transition: 'border-color 0.15s',
          outline: 'none',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border-subtle)')}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--border-subtle)', fontSize: 14,
          background: '#fff', color: 'var(--text-main)', cursor: 'pointer',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
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
      <span style={{
        fontSize: 15, fontWeight: highlight ? 700 : 500,
        color: highlight ? 'var(--primary)' : 'var(--text-main)',
      }}>{value}</span>
    </div>
  );
}

function ErrorBox({ msg }) {
  return msg ? (
    <div style={{
      background: 'var(--danger-light)', border: '1px solid var(--danger-border)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--danger)',
      fontSize: 13, marginTop: 12,
    }}>⚠️ {msg}</div>
  ) : null;
}

function Disclaimer({ text }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>
      🛡️ {text}
    </p>
  );
}

function Btn({ onClick, loading, children, style }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="btn btn-primary"
      style={{ marginTop: 4, opacity: loading ? 0.7 : 1, ...style }}
    >
      {loading ? '⏳ Calculating…' : children}
    </button>
  );
}

// ── Tab 1: In-Hand Calculator ────────────────────────────────
function InHandTab() {
  const [form, setForm] = useState({
    basicAnnual: 600000, hraAnnual: 240000, specialAllowanceAnnual: 160000,
    bonusAnnual: 0, pfEmployeeAnnual: 72000, regime: 'new', cityType: 'metro', age: 28,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const calc = async () => {
    setLoading(true); setError('');
    try { setResult(await calculateInHand(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Salary Components (Annual)</h3>
        <Input label="Basic Salary (₹)" value={form.basicAnnual} onChange={set('basicAnnual')} />
        <Input label="HRA (₹)" value={form.hraAnnual} onChange={set('hraAnnual')} />
        <Input label="Special Allowance (₹)" value={form.specialAllowanceAnnual} onChange={set('specialAllowanceAnnual')} />
        <Input label="Bonus (₹)" value={form.bonusAnnual} onChange={set('bonusAnnual')} />
        <Input label="Employee PF (₹)" value={form.pfEmployeeAnnual} onChange={set('pfEmployeeAnnual')} />
        <Select label="Tax Regime" value={form.regime} onChange={set('regime')}
          options={[{ value: 'new', label: 'New Regime (FY 2024-25)' }, { value: 'old', label: 'Old Regime' }]} />
        <Select label="City Type" value={form.cityType} onChange={set('cityType')}
          options={[{ value: 'metro', label: 'Metro (Mumbai/Delhi/Kolkata/Chennai)' }, { value: 'non-metro', label: 'Non-Metro' }]} />
        <Input label="Age (years)" value={form.age} onChange={set('age')} min={18} />
        <Btn onClick={calc} loading={loading}>Calculate Take-Home</Btn>
        <ErrorBox msg={error} />
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Monthly Breakdown</h3>
        {result ? (
          <>
            <ResultRow label="Gross Monthly" value={fmt(result.grossMonthly)} />
            <ResultRow label="PF Deduction" value={`- ${fmt(result.pfMonthly)}`} />
            <ResultRow label="Professional Tax" value={`- ${fmt(result.profTaxMonthly)}`} />
            <ResultRow label="Income Tax (TDS)" value={`- ${fmt(result.taxMonthly)}`} />
            <ResultRow label="Net Take-Home / Month" value={fmt(result.netMonthly)} highlight />
            <ResultRow label="Annual Tax" value={fmt(result.annualTax)} />
            <ResultRow label="Annual Net" value={fmt(result.annualNet)} highlight />

            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Slab Breakdown</p>
              {result.slabBreakdown.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0' }}>
                  <span>₹{s.from.toLocaleString('en-IN')} – {s.to === Infinity ? '∞' : '₹' + s.to.toLocaleString('en-IN')} @ {s.rate}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(s.taxOnSlab)}</span>
                </div>
              ))}
            </div>
            <Disclaimer text={result.disclaimer} />
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
            Fill in salary details and click Calculate.
          </p>
        )}
      </Card>
    </div>
  );
}

// ── Tab 2: Payslip Audit ─────────────────────────────────────
function PayslipAuditTab() {
  const [form, setForm] = useState({
    basicAnnual: 600000, hraAnnual: 240000, pfEmployeeAnnual: 72000,
    actualBasicMonthly: 50000, actualHraMonthly: 20000,
    actualPfMonthly: 1800, actualProfTaxMonthly: 200,
    actualTdsMonthly: 0, actualNetMonthly: 0, regime: 'new',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true); setError('');
    try { setResult(await payslipAudit(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const severityColor = { HIGH: 'var(--danger)', MEDIUM: 'var(--warning)', LOW: 'var(--info)' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 700 }}>Enter Offer Letter Values (Annual)</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>What your offer letter says</p>
        <Input label="Basic Annual (₹)" value={form.basicAnnual} onChange={set('basicAnnual')} />
        <Input label="HRA Annual (₹)" value={form.hraAnnual} onChange={set('hraAnnual')} />
        <Input label="Employee PF Annual (₹)" value={form.pfEmployeeAnnual} onChange={set('pfEmployeeAnnual')} />
        <Select label="Regime" value={form.regime} onChange={set('regime')}
          options={[{ value: 'new', label: 'New Regime' }, { value: 'old', label: 'Old Regime' }]} />

        <h3 style={{ marginBottom: 4, marginTop: 8, fontSize: 16, fontWeight: 700 }}>Enter Payslip Values (Monthly)</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>What your payslip actually shows</p>
        <Input label="Basic on Payslip (₹/mo)" value={form.actualBasicMonthly} onChange={set('actualBasicMonthly')} />
        <Input label="HRA on Payslip (₹/mo)" value={form.actualHraMonthly} onChange={set('actualHraMonthly')} />
        <Input label="PF on Payslip (₹/mo)" value={form.actualPfMonthly} onChange={set('actualPfMonthly')} />
        <Input label="Prof Tax on Payslip (₹/mo)" value={form.actualProfTaxMonthly} onChange={set('actualProfTaxMonthly')} />
        <Input label="TDS on Payslip (₹/mo)" value={form.actualTdsMonthly} onChange={set('actualTdsMonthly')} />
        <Input label="Net Salary on Payslip (₹/mo)" value={form.actualNetMonthly} onChange={set('actualNetMonthly')} />
        <Btn onClick={run} loading={loading}>Run Payslip Audit</Btn>
        <ErrorBox msg={error} />
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Audit Results</h3>
        {result ? (
          <>
            <div style={{
              background: result.flagCount === 0 ? 'var(--success-light)' : 'var(--warning-light)',
              border: `1px solid ${result.flagCount === 0 ? 'var(--success-border)' : 'var(--warning-border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 20,
              fontSize: 14, fontWeight: 600,
              color: result.flagCount === 0 ? 'var(--success)' : 'var(--warning)',
            }}>
              {result.flagCount === 0 ? '✅ No issues found! Your payslip looks consistent.' : `⚠️ ${result.flagCount} issue(s) found`}
            </div>
            {result.flags.map((f, i) => (
              <div key={i} style={{
                borderLeft: `4px solid ${severityColor[f.severity]}`,
                paddingLeft: 12, marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: severityColor[f.severity] }}>{f.severity} — {f.field}</div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', marginTop: 4 }}>{f.message}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>📖 {f.rule}</div>
              </div>
            ))}
            <Disclaimer text={result.disclaimer} />
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 40, textAlign: 'center' }}>
            Enter your offer and payslip values, then run the audit.
          </p>
        )}
      </Card>
    </div>
  );
}

// ── Tab 3: Regime Comparison ─────────────────────────────────
function RegimeCompareTab() {
  const [form, setForm] = useState({
    basicAnnual: 600000, hraAnnual: 240000, specialAllowanceAnnual: 160000,
    section80C: 150000, section80D: 25000, section80CCD1B: 0,
    rentPaidAnnual: 0, pfEmployeeAnnual: 72000, age: 28, cityType: 'metro',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const compare = async () => {
    setLoading(true); setError('');
    try { setResult(await regimeCompare(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Salary Inputs</h3>
          <Input label="Basic Annual (₹)" value={form.basicAnnual} onChange={set('basicAnnual')} />
          <Input label="HRA Annual (₹)" value={form.hraAnnual} onChange={set('hraAnnual')} />
          <Input label="Special Allowance Annual (₹)" value={form.specialAllowanceAnnual} onChange={set('specialAllowanceAnnual')} />
          <Input label="Employee PF Annual (₹)" value={form.pfEmployeeAnnual} onChange={set('pfEmployeeAnnual')} />
          <Input label="Age" value={form.age} onChange={set('age')} />
        </Card>
        <Card>
          <h3 style={{ marginBottom: 4, fontSize: 16, fontWeight: 700 }}>Old Regime Deductions</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Adjust sliders to see live impact on old regime tax</p>
          <div style={{ marginBottom: 16 }}>
            <Label>Section 80C — ₹{form.section80C.toLocaleString('en-IN')} / ₹1,50,000</Label>
            <input type="range" min={0} max={150000} step={5000} value={form.section80C}
              onChange={(e) => set('section80C')(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Label>Section 80D — ₹{form.section80D.toLocaleString('en-IN')} / ₹25,000</Label>
            <input type="range" min={0} max={25000} step={1000} value={form.section80D}
              onChange={(e) => set('section80D')(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Label>NPS 80CCD(1B) — ₹{form.section80CCD1B.toLocaleString('en-IN')} / ₹50,000</Label>
            <input type="range" min={0} max={50000} step={5000} value={form.section80CCD1B}
              onChange={(e) => set('section80CCD1B')(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }} />
          </div>
          <Input label="Annual Rent Paid (₹) — for HRA exemption" value={form.rentPaidAnnual} onChange={set('rentPaidAnnual')} />
          <Btn onClick={compare} loading={loading}>Compare Regimes</Btn>
          <ErrorBox msg={error} />
        </Card>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { label: 'New Regime', data: result.new, accent: '#4f46e5' },
            { label: 'Old Regime', data: result.old, accent: '#059669' },
          ].map(({ label, data, accent }) => (
            <Card key={label} style={{ borderTop: `4px solid ${accent}` }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: accent, marginBottom: 12 }}>{label}</h4>
              <ResultRow label="Gross Monthly" value={fmt(data.grossMonthly)} />
              <ResultRow label="PF" value={`- ${fmt(data.pfMonthly)}`} />
              <ResultRow label="Tax Monthly" value={`- ${fmt(data.taxMonthly)}`} />
              <ResultRow label="Net Monthly" value={fmt(data.netMonthly)} highlight />
              <ResultRow label="Annual Tax" value={fmt(data.annualTax)} />
            </Card>
          ))}
          <Card style={{ borderTop: '4px solid var(--warning)', background: 'var(--warning-light)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--warning)', marginBottom: 12 }}>Verdict</h4>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', marginBottom: 8 }}>
              {result.betterRegime === 'new' ? '🏆 New' : '🏆 Old'} Regime
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>saves you</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)', margin: '8px 0' }}>
              {fmt(result.annualSaving)} / year
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{fmt(result.monthlySaving)} / month</div>
            <Disclaimer text={result.disclaimer} />
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: Savings Gap ───────────────────────────────────────
function SavingsGapTab() {
  const [form, setForm] = useState({ netMonthly: 75000, currentMonthlySavings: 10000, targetSavingsRate: 0.3, section80C: 50000, section80D: 0, section80CCD1B: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true); setError('');
    try { setResult(await savingsGap(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Your Numbers</h3>
        <Input label="Monthly Net Take-Home (₹)" value={form.netMonthly} onChange={set('netMonthly')} />
        <Input label="Current Monthly Savings (₹)" value={form.currentMonthlySavings} onChange={set('currentMonthlySavings')} />
        <div style={{ marginBottom: 16 }}>
          <Label>Target Savings Rate — {Math.round(form.targetSavingsRate * 100)}%</Label>
          <input type="range" min={0.1} max={0.6} step={0.05} value={form.targetSavingsRate}
            onChange={(e) => set('targetSavingsRate')(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--primary)' }} />
        </div>
        <h3 style={{ marginBottom: 4, marginTop: 8, fontSize: 15, fontWeight: 700 }}>Current Deductions (Old Regime)</h3>
        <Input label="Section 80C invested so far (₹)" value={form.section80C} onChange={set('section80C')} />
        <Input label="Section 80D premium (₹)" value={form.section80D} onChange={set('section80D')} />
        <Input label="NPS 80CCD(1B) (₹)" value={form.section80CCD1B} onChange={set('section80CCD1B')} />
        <Btn onClick={run} loading={loading}>Calculate Gap</Btn>
        <ErrorBox msg={error} />
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Savings Analysis</h3>
        {result ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { l: 'Current Rate', v: result.actualSavingsRate, c: 'var(--danger)' },
                { l: 'Target Rate', v: result.targetSavingsRate, c: 'var(--success)' },
                { l: 'Monthly Gap', v: fmt(result.monthlySavingsGap), c: 'var(--warning)' },
                { l: 'Annual Gap', v: fmt(result.annualSavingsGap), c: 'var(--warning)' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
            {result.unusedDeductions.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>💡 Unused Tax-Saving Headroom (Old Regime)</p>
                {result.unusedDeductions.map((d, i) => (
                  <div key={i} style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>{d.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{d.note}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>Unused: {fmt(d.unusedAnnual)}/yr</div>
                  </div>
                ))}
              </>
            )}
            <Disclaimer text={result.disclaimer} />
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 40, textAlign: 'center' }}>Enter your numbers to see the savings gap.</p>
        )}
      </Card>
    </div>
  );
}

// ── Tab 5: TDS & Advance Tax ─────────────────────────────────
function TdsTab() {
  const [form, setForm] = useState({ basicAnnual: 600000, hraAnnual: 240000, specialAllowanceAnnual: 160000, pfEmployeeAnnual: 72000, regime: 'new', otherIncomeAnnual: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const run = async () => {
    setLoading(true); setError('');
    try { setResult(await tdsEstimate(form)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Salary Inputs</h3>
        <Input label="Basic Annual (₹)" value={form.basicAnnual} onChange={set('basicAnnual')} />
        <Input label="HRA Annual (₹)" value={form.hraAnnual} onChange={set('hraAnnual')} />
        <Input label="Special Allowance Annual (₹)" value={form.specialAllowanceAnnual} onChange={set('specialAllowanceAnnual')} />
        <Input label="Employee PF Annual (₹)" value={form.pfEmployeeAnnual} onChange={set('pfEmployeeAnnual')} />
        <Input label="Other Income Annual (₹) — freelance, interest, rent" value={form.otherIncomeAnnual} onChange={set('otherIncomeAnnual')} />
        <Select label="Regime" value={form.regime} onChange={set('regime')}
          options={[{ value: 'new', label: 'New Regime' }, { value: 'old', label: 'Old Regime' }]} />
        <Btn onClick={run} loading={loading}>Estimate TDS & Advance Tax</Btn>
        <ErrorBox msg={error} />
      </Card>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>TDS & Advance Tax</h3>
        {result ? (
          <>
            <ResultRow label="Salary Tax (Annual)" value={fmt(result.salariedTaxAnnual)} />
            <ResultRow label="Other Income Tax Est." value={fmt(result.otherIncomeTaxEstimate)} />
            <ResultRow label="Total Annual Tax" value={fmt(result.totalTaxAnnual)} highlight />
            <ResultRow label="Monthly TDS (from salary)" value={fmt(result.monthlyTds)} />

            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>
                {result.advanceTaxApplicable ? '📅 Advance Tax Schedule (FY 2024-25)' : '✅ Advance tax not applicable (tax < ₹10,000)'}
              </p>
              {result.advanceTaxSchedule.map((s) => (
                <div key={s.installment} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{s.installment} Instalment</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Due: {s.dueDate}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{fmt(s.amountDue)}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Assumptions</p>
              {result.assumptions.map((a, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>• {a}</p>
              ))}
            </div>
            <Disclaimer text={result.disclaimer} />
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 40, textAlign: 'center' }}>Enter salary details to estimate TDS.</p>
        )}
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
const COMPONENTS = [InHandTab, PayslipAuditTab, RegimeCompareTab, SavingsGapTab, TdsTab];

export default function SalaryTaxPage() {
  const [tab, setTab] = useState(0);
  const TabContent = COMPONENTS[tab];

  return (
    <div className="app-container page-wrapper">
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          💰 Salary & Tax Calculator
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
          FY 2024-25 · Finance Act 2024 · Old & New Regime
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: 13,
              fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === i ? 'var(--primary)' : 'var(--bg-subtle)',
              color: tab === i ? '#fff' : 'var(--text-secondary)',
              transition: 'var(--transition)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <TabContent />

      {/* Global disclaimer */}
      <div style={{
        marginTop: 40, padding: '14px 18px',
        background: 'var(--warning-light)', border: '1px solid var(--warning-border)',
        borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--warning)',
      }}>
        🛡️ <strong>Educational estimates only.</strong> Not SEBI-registered financial or legal advice. Always verify with a qualified Chartered Accountant.
        Sources: Finance Act 2024, Income Tax Act 1961.
      </div>
    </div>
  );
}