/**
 * Offers Module — Components (index.jsx)
 * CompareOffers | EsopCalculator | CounterEmail | HrRoleplay | NegotiationScorecard
 *
 * Design principles:
 *  - CSS design system variables only (no arbitrary hex in styles)
 *  - No alert() — all errors via showToast prop or console.error
 *  - API calls include x-user-id header
 *  - All math done server-side; LLM only generates text
 */

import React, { useState, useEffect, useRef } from 'react';
import * as i18n from '../i18n';

const API_HEADER = () => ({
  'Content-Type': 'application/json',
  'x-user-id': localStorage.getItem('fin_user_id') || 'default-user',
});

// ─────────────────────────────────────────────────────────────
// Shared helper styles
// ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  color: 'var(--text-main)',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const sectionCard = {
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: 16,
  marginBottom: 16,
};

const labelStyle = {
  display: 'block',
  fontWeight: 600,
  fontSize: 13,
  color: 'var(--text-secondary)',
  marginBottom: 6,
};

// ─────────────────────────────────────────────────────────────
// COMPARE OFFERS
// ─────────────────────────────────────────────────────────────
export const CompareOffers = ({
  savedOffers,
  onLoadOffers,
  onCompare,
  comparisonResult,
  comparing,
  demoOffers,
  showToast,
}) => {
  const [manualOffers, setManualOffers] = useState([
    { companyName: '', ctcAnnual: '', baseSalary: '', hra: '', variableBonus: '', noticePeriod: '', bondAmount: '' },
    { companyName: '', ctcAnnual: '', baseSalary: '', hra: '', variableBonus: '', noticePeriod: '', bondAmount: '' },
  ]);
  const [selectedSaved, setSelectedSaved] = useState([]);

  useEffect(() => {
    onLoadOffers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (demoOffers && demoOffers.length > 0) {
      setManualOffers(
        demoOffers.map((o) => ({
          companyName: o.companyName || '',
          ctcAnnual: o.ctcAnnual || '',
          baseSalary: o.baseSalary || '',
          hra: o.hra || '',
          variableBonus: o.variableBonus || '',
          noticePeriod: o.noticePeriod || '',
          bondAmount: o.bondAmount || '',
        }))
      );
    }
  }, [demoOffers]);

  const addOffer = () =>
    setManualOffers([
      ...manualOffers,
      { companyName: '', ctcAnnual: '', baseSalary: '', hra: '', variableBonus: '', noticePeriod: '', bondAmount: '' },
    ]);

  const removeOffer = (idx) => setManualOffers(manualOffers.filter((_, i) => i !== idx));

  const updateOffer = (idx, field, value) =>
    setManualOffers(manualOffers.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));

  const handleCompare = () => {
    const fromManual = manualOffers
      .filter((o) => o.companyName && o.ctcAnnual)
      .map((o) => ({
        ...o,
        ctcAnnual: parseInt(o.ctcAnnual) || 0,
        baseSalary: parseInt(o.baseSalary) || 0,
        hra: parseInt(o.hra) || 0,
        variableBonus: parseInt(o.variableBonus) || 0,
        noticePeriod: parseInt(o.noticePeriod) || 0,
        bondAmount: parseInt(o.bondAmount) || 0,
      }));
    const fromSaved = savedOffers.filter((o) => selectedSaved.includes(o.documentId));
    const all = [...fromSaved, ...fromManual];
    if (all.length < 2) {
      showToast
        ? showToast('Add at least 2 offers to compare', 'error')
        : console.error('Need 2+ offers');
      return;
    }
    onCompare(all);
  };

  const fmtL = (val) => (val ? `₹${(val / 100000).toFixed(1)}L` : '—');

  const FIELDS = [
    { key: 'companyName', label: 'Company Name', type: 'text', placeholder: 'e.g. Google India' },
    { key: 'ctcAnnual', label: 'CTC Annual (₹)', type: 'number', placeholder: '3200000' },
    { key: 'baseSalary', label: 'Basic Salary (₹)', type: 'number', placeholder: '2000000' },
    { key: 'hra', label: 'HRA (₹)', type: 'number', placeholder: '900000' },
    { key: 'variableBonus', label: 'Variable Pay (₹)', type: 'number', placeholder: '300000' },
    { key: 'noticePeriod', label: 'Notice (days)', type: 'number', placeholder: '60' },
    { key: 'bondAmount', label: 'Bond Amount (₹)', type: 'number', placeholder: '0' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
          ⚖️ Compare Offers
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Enter 2–4 offers manually or select from your saved documents. We compare every metric deterministically.
        </p>
      </div>

      {/* Saved Offers Selection */}
      {savedOffers.length > 0 && (
        <div style={sectionCard}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
            📂 From Saved Documents
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {savedOffers.map((offer) => {
              const selected = selectedSaved.includes(offer.documentId);
              return (
                <label
                  key={offer.documentId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: selected ? 'var(--primary-light)' : '#fff',
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    color: selected ? 'var(--primary)' : 'var(--text-main)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) =>
                      setSelectedSaved(
                        e.target.checked
                          ? [...selectedSaved, offer.documentId]
                          : selectedSaved.filter((id) => id !== offer.documentId)
                      )
                    }
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>{offer.companyName || 'Unknown'}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {fmtL(offer.ctcAnnual)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Entry Cards */}
      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', margin: '0 0 12px' }}>
        ✏️ Manual Entry
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {manualOffers.map((offer, idx) => (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  padding: '2px 10px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Offer #{idx + 1}
              </span>
              {manualOffers.length > 2 && (
                <button
                  onClick={() => removeOffer(idx)}
                  style={{
                    border: 'none',
                    background: 'var(--danger-light)',
                    color: 'var(--danger)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  × Remove
                </button>
              )}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
              }}
            >
              {FIELDS.map((field) => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={offer[field.key] || ''}
                    onChange={(e) => updateOffer(idx, field.key, e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <button
          onClick={addOffer}
          disabled={manualOffers.length >= 4}
          style={{
            padding: '9px 18px',
            background: '#fff',
            color: 'var(--primary)',
            border: '1.5px dashed var(--primary)',
            borderRadius: 'var(--radius-md)',
            cursor: manualOffers.length >= 4 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 13,
            opacity: manualOffers.length >= 4 ? 0.5 : 1,
          }}
        >
          + Add Another Offer
        </button>
        <button
          className="btn btn-primary"
          onClick={handleCompare}
          disabled={comparing}
          style={{ fontSize: 14 }}
        >
          {comparing ? '⏳ Analyzing...' : '⚖️ Compare Offers'}
        </button>
      </div>

      {/* Results */}
      {comparisonResult && (
        <div>
          {/* Winner Banner */}
          {comparisonResult.winner && (
            <div
              style={{
                background: 'linear-gradient(135deg, #065f46, #047857)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 28 }}>🏆</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  Top Pick: {comparisonResult.winner.companyName}
                </div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  {comparisonResult.winner.reason || 'Best overall package based on take-home and flexibility.'}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Matrix */}
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      borderBottom: '2px solid var(--border-subtle)',
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Metric
                  </th>
                  {comparisonResult.offers.map((offer, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        borderBottom: '2px solid var(--border-subtle)',
                        borderLeft: '1px solid var(--border-subtle)',
                        minWidth: 130,
                      }}
                    >
                      {offer.companyName || `Offer ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonResult.comparison.map((row, ri) => (
                  <tr
                    key={row.key}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: ri % 2 === 0 ? '#fff' : 'var(--bg-subtle)',
                    }}
                  >
                    <td
                      style={{
                        padding: '11px 16px',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        fontSize: 13,
                      }}
                    >
                      {row.label}
                    </td>
                    {row.values.map((val, vi) => (
                      <td
                        key={vi}
                        style={{
                          padding: '11px 16px',
                          textAlign: 'center',
                          fontWeight: val.isWinner ? 700 : 400,
                          color: val.isWinner ? 'var(--success)' : 'var(--text-main)',
                          background: val.isWinner
                            ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
                            : 'transparent',
                          borderLeft: '1px solid var(--border-subtle)',
                        }}
                      >
                        {val.formatted}
                        {val.isWinner && <span style={{ marginLeft: 4 }}>🏆</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {comparisonResult.summary && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: 'var(--info-light)',
                border: '1px solid var(--info-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                color: 'var(--info)',
              }}
            >
              💡 {comparisonResult.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ESOP CALCULATOR
// ─────────────────────────────────────────────────────────────
export const EsopCalculator = ({ showToast }) => {
  const [inputs, setInputs] = useState({
    totalOptions: 5000,
    strikePrice: 10,
    totalCompanyShares: 10000000,
    currentValuation: 150,
    cliffMonths: 12,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState('base');

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/offers/esop', {
        method: 'POST',
        headers: API_HEADER(),
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data);
        if (showToast) showToast('ESOP scenarios calculated ✓', 'success');
      } else {
        if (showToast) showToast('Calculation failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      if (showToast) showToast('Calculation failed: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const fmtCurrency = (val) =>
    val != null ? `₹${Number(val).toLocaleString('en-IN')}` : '—';

  const SCENARIOS = [
    { key: 'bear', label: '🐻 Bear', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', mult: '1.5×' },
    { key: 'base', label: '📊 Base', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', mult: '5×' },
    { key: 'bull', label: '🚀 Bull', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', mult: '10×' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
          📈 ESOP Calculator
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Model your equity value across Bear (1.5×) / Base (5×) / Bull (10×) exit scenarios with 4-year vesting.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, alignItems: 'start' }}>
        {/* Input Panel */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' }}>
            Grant Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'totalOptions', label: 'Total Options', step: 100 },
              { key: 'strikePrice', label: 'Strike Price (₹/share)', step: 0.01 },
              { key: 'totalCompanyShares', label: 'Total Company Shares', step: 100000 },
              { key: 'currentValuation', label: 'Current FMV / Share (₹)', step: 0.01 },
              { key: 'cliffMonths', label: 'Cliff (months)', step: 1 },
            ].map(({ key, label, step }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="number"
                  step={step}
                  value={inputs[key]}
                  onChange={(e) =>
                    setInputs({ ...inputs, [key]: parseFloat(e.target.value) || 0 })
                  }
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
                />
              </div>
            ))}
            <button
              className="btn btn-primary"
              onClick={handleCalculate}
              disabled={loading}
              style={{ marginTop: 4, width: '100%', fontSize: 14 }}
            >
              {loading ? '⏳ Calculating...' : '🔢 Calculate Scenarios'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        {results ? (
          <div>
            {/* Summary Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                { label: 'Ownership', value: `${results.inputs.ownershipPct}%`, icon: '📊' },
                { label: 'Exercise Cost', value: fmtCurrency(results.exerciseCost), icon: '💸' },
                { label: 'Paper Value (Now)', value: fmtCurrency(results.inputs.totalOptions * results.inputs.currentValuation), icon: '📋' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ fontSize: 22 }}>{stat.icon}</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--primary)',
                      margin: '4px 0',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Scenario Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 14,
                borderBottom: '2px solid var(--border-subtle)',
                paddingBottom: 0,
              }}
            >
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveScenario(s.key)}
                  style={{
                    padding: '8px 18px',
                    border: 'none',
                    borderBottom: `3px solid ${activeScenario === s.key ? s.color : 'transparent'}`,
                    background: activeScenario === s.key ? s.bg : 'transparent',
                    color: activeScenario === s.key ? s.color : 'var(--text-muted)',
                    fontWeight: activeScenario === s.key ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    borderRadius: '6px 6px 0 0',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.label} <span style={{ fontSize: 11, opacity: 0.75 }}>{s.mult}</span>
                </button>
              ))}
            </div>

            {/* Active Scenario Table */}
            {SCENARIOS.filter((s) => s.key === activeScenario).map((scenario) => (
              <div key={scenario.key}>
                <div
                  style={{
                    overflowX: 'auto',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${scenario.border}`,
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: scenario.bg }}>
                        {['Year', 'Vested %', 'Options', 'Exit Price', 'Gross Value', 'Net After Tax'].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                padding: '10px 12px',
                                textAlign: h === 'Year' ? 'left' : 'right',
                                fontWeight: 700,
                                color: scenario.color,
                                fontSize: 12,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {results.projections[scenario.key]?.map((p, i) => (
                        <tr
                          key={i}
                          style={{
                            borderTop: `1px solid ${scenario.border}`,
                            background: i % 2 === 0 ? '#fff' : scenario.bg,
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 600 }}>Year {p.year}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>{p.vestedPercentage}%</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {Number(p.vestedOptions).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{p.exitPricePerShare}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {fmtCurrency(p.grossValue)}
                          </td>
                          <td
                            style={{
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontWeight: 700,
                              color: scenario.color,
                            }}
                          >
                            {fmtCurrency(p.netAfterTax)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <details
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    ℹ️ Assumptions &amp; methodology
                  </summary>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.8 }}>
                    {results.assumptions &&
                      Object.entries(results.assumptions).map(([k, v]) => (
                        <li key={k}>
                          <strong>{k}:</strong> {v}
                        </li>
                      ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              color: 'var(--text-muted)',
              textAlign: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 48 }}>📈</span>
            <p style={{ fontSize: 15, fontWeight: 500 }}>Fill in grant details and click Calculate</p>
            <p style={{ fontSize: 13 }}>
              We'll model Bear / Base / Bull exits with 4-year vesting schedule
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COUNTER EMAIL
// ─────────────────────────────────────────────────────────────
export const CounterEmail = ({ savedOffers, demoOffer, showToast }) => {
  const [currentOfferId, setCurrentOfferId] = useState('');
  const [asks, setAsks] = useState([
    { type: 'higher_base', targetValue: '', justification: '' },
  ]);
  const [tone, setTone] = useState('polite_enthusiastic');
  const [competingOffers, setCompetingOffers] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const ASK_OPTIONS = [
    { value: 'higher_base', label: '💰 Higher Base Salary' },
    { value: 'joining_bonus', label: '🎁 Joining Bonus' },
    { value: 'signing_bonus', label: '✍️ Signing Bonus' },
    { value: 'reduce_notice', label: '⏰ Reduce Notice Period' },
    { value: 'reduce_bond', label: '🔓 Remove Bond Clause' },
    { value: 'better_esop', label: '📈 Better ESOP Grant' },
  ];

  const TONE_OPTIONS = [
    { value: 'polite_enthusiastic', label: '🙏 Polite & Enthusiastic', desc: 'Warm, grateful tone. Best for first-time negotiators.' },
    { value: 'confident_assertive', label: '💪 Confident & Assertive', desc: 'Direct, data-backed. Best when you have market data.' },
    { value: 'high_leverage', label: '⚡ High Leverage', desc: 'Multi-offer pressure. Best when you have competing offers.' },
  ];

  const handleGenerate = async () => {
    if (!currentOfferId) {
      if (showToast) showToast('Select a current offer first', 'error');
      return;
    }
    if (!asks.some((a) => a.targetValue)) {
      if (showToast) showToast('Add at least one negotiation ask with a target value', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/offers/email', {
        method: 'POST',
        headers: API_HEADER(),
        body: JSON.stringify({
          ...(currentOfferId === '__demo__' ? { currentOffer: demoOffer } : { currentOfferId }),
          asks: asks.filter((a) => a.targetValue),
          tone,
          competingOfferIds: competingOffers.map((o) => o.documentId),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmail(data.email);
        if (showToast) showToast('Email generated ✓ — review and copy!', 'success');
      } else {
        if (showToast) showToast('Generation failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      if (showToast) showToast('Generation failed: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      if (showToast) showToast('Email copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
          ✉️ Counter-Offer Email Generator
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Generate a professional negotiation email with your verified salary numbers and market data.
        </p>
      </div>

      {savedOffers.length === 0 && !demoOffer ? (
        <div
          style={{
            padding: '32px 24px',
            textAlign: 'center',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0 8px' }}>
            No saved offers found
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Upload and extract an offer letter in the{' '}
            <a href="/documents" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Documents
            </a>{' '}
            tab first, then come back here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Left: Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Current Offer */}
            <div style={sectionCard}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Current Offer</h4>
              <label style={labelStyle}>Select Offer to Negotiate</label>
              <select
                value={currentOfferId}
                onChange={(e) => setCurrentOfferId(e.target.value)}
                style={{ ...inputStyle }}
              >
                <option value="">Choose a saved offer...</option>
                {demoOffer && <option value="__demo__">Demo Tech Co. — ₹18.0L (practice)</option>}
                {savedOffers.map((o) => (
                  <option key={o.documentId} value={o.documentId}>
                    {o.companyName} — ₹{((o.ctcAnnual || 0) / 100000).toFixed(1)}L
                  </option>
                ))}
              </select>
            </div>

            {/* Negotiation Asks */}
            <div style={sectionCard}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Negotiation Asks</h4>
              {asks.map((ask, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 8, marginBottom: 8 }}>
                  <select
                    value={ask.type}
                    onChange={(e) =>
                      setAsks(asks.map((a, i) => (i === idx ? { ...a, type: e.target.value } : a)))
                    }
                    style={inputStyle}
                  >
                    {ASK_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Target value"
                    value={ask.targetValue}
                    onChange={(e) =>
                      setAsks(asks.map((a, i) => (i === idx ? { ...a, targetValue: e.target.value } : a)))
                    }
                    style={{ ...inputStyle }}
                  />
                  {asks.length > 1 && (
                    <button
                      onClick={() => setAsks(asks.filter((_, i) => i !== idx))}
                      style={{
                        border: 'none',
                        background: 'var(--danger-light)',
                        color: 'var(--danger)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0 10px',
                        cursor: 'pointer',
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() =>
                  setAsks([...asks, { type: 'higher_base', targetValue: '', justification: '' }])
                }
                style={{
                  marginTop: 4,
                  padding: '7px 14px',
                  background: '#fff',
                  color: 'var(--primary)',
                  border: '1.5px dashed var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                + Add Ask
              </button>
            </div>

            {/* Tone Selector — Pill Cards */}
            <div style={sectionCard}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>Email Tone</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TONE_OPTIONS.map((t) => (
                  <label
                    key={t.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      border: `1.5px solid ${tone === t.value ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      background: tone === t.value ? 'var(--primary-light)' : '#fff',
                    }}
                  >
                    <input
                      type="radio"
                      name="tone"
                      value={t.value}
                      checked={tone === t.value}
                      onChange={() => setTone(t.value)}
                      style={{ accentColor: 'var(--primary)', marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {t.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              className="btn btn-success"
              onClick={handleGenerate}
              disabled={loading}
              style={{ width: '100%', fontSize: 14 }}
            >
              {loading ? '⏳ Generating...' : '✉️ Generate Email'}
            </button>
          </div>

          {/* Right: Email Output */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                Generated Email
              </span>
              {email && (
                <button
                  className="btn btn-secondary"
                  onClick={handleCopy}
                  style={{ fontSize: 12, padding: '6px 14px' }}
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {email ? (
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: 'var(--text-main)',
                    margin: 0,
                  }}
                >
                  {email}
                </pre>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: 280,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 40 }}>✉️</span>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Your email will appear here</p>
                  <p style={{ fontSize: 12 }}>Configure your asks and click Generate Email</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// HR ROLEPLAY
// ─────────────────────────────────────────────────────────────
export const HrRoleplay = ({ savedOffers, demoOffer, showToast }) => {
  const [offerId, setOfferId] = useState('');
  const [persona, setPersona] = useState('friendly_recruiter');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [turn, setTurn] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const PERSONAS = [
    {
      value: 'friendly_recruiter',
      label: '🤝 Friendly Recruiter',
      desc: 'Collaborative and open to creative solutions. Great for building negotiation confidence.',
      color: 'var(--success)',
      bg: 'var(--success-light)',
      border: 'var(--success-border)',
    },
    {
      value: 'stubborn_enterprise',
      label: '🏢 Enterprise HR',
      desc: 'Policy-driven and rigid. Needs strong market data and solid justification to move.',
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
      border: 'var(--warning-border)',
    },
    {
      value: 'aggressive_startup',
      label: '🚀 Startup Founder',
      desc: 'Equity-focused, cash-tight. Uses pressure tactics. Tests your leverage handling.',
      color: 'var(--danger)',
      bg: 'var(--danger-light)',
      border: 'var(--danger-border)',
    },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStart = () => {
    setMessages([
      {
        role: 'hr',
        content:
          "Hi! Thanks for getting back to me. I'm excited to move forward with you. Before we finalize everything, I wanted to open the floor — are there any aspects of the offer you'd like to discuss further?",
      },
    ]);
    setTurn(1);
    setIsComplete(false);
    setScorecard(null);
  };

  const handleSend = async () => {
    if (!userInput.trim() || !offerId) return;
    setLoading(true);
    const userMsg = userInput;
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setUserInput('');

    try {
      const res = await fetch('/api/offers/roleplay', {
        method: 'POST',
        headers: API_HEADER(),
        body: JSON.stringify({
          ...(offerId === '__demo__' ? { offer: demoOffer } : { offerId }),
          conversationHistory: messages.map((m) => m.content),
          userMessage: userMsg,
          persona,
          turnNumber: turn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedMessages = [...newMessages, { role: 'hr', content: data.hrResponse }];
        setMessages(updatedMessages);
        setTurn(data.turnNumber);
        if (data.isComplete) {
          setIsComplete(true);
          if (showToast) showToast('Negotiation complete! Generating scorecard...', 'info');
          // Auto-generate scorecard
          const scoreRes = await fetch('/api/offers/scorecard', {
            method: 'POST',
            headers: API_HEADER(),
            body: JSON.stringify({
              ...(offerId === '__demo__' ? { offer: demoOffer } : { offerId }),
              conversationHistory: updatedMessages.map((m) => m.content),
              persona,
            }),
          });
          const scoreData = await scoreRes.json();
          if (scoreData.success) {
            setScorecard(scoreData.scorecard);
            if (showToast) showToast('Scorecard ready! Review your performance.', 'success');
          } else if (showToast) {
            showToast('Scorecard failed: ' + (scoreData.error || 'Unknown error'), 'error');
          }
        }
      } else if (showToast) {
        showToast('HR response failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      if (showToast) showToast('Roleplay error: ' + e.message, 'error');
    }
    setLoading(false);
  };

  const handleRestart = () => {
    setMessages([]);
    setTurn(1);
    setIsComplete(false);
    setScorecard(null);
  };

  const selectedPersona = PERSONAS.find((p) => p.value === persona);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
          🎭 AI HR Recruiter Role-Play
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
          Practice salary negotiations in a safe environment. Get scored on assertiveness, leverage, and professionalism.
        </p>
      </div>

      {scorecard ? (
        <>
          <NegotiationScorecard scorecard={scorecard} />
          <button
            className="btn btn-secondary"
            onClick={handleRestart}
            style={{ marginTop: 20 }}
          >
            🔄 Practice Another Negotiation
          </button>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
          {/* Setup Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Offer Select */}
            <div style={sectionCard}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Select Offer</label>
              {savedOffers.length === 0 && !demoOffer ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                  No saved offers. Extract from Documents first.
                </p>
              ) : (
                <select
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Choose a saved offer...</option>
                  {demoOffer && <option value="__demo__">Demo Tech Co. — ₹18.0L (practice)</option>}
                  {savedOffers.map((o) => (
                    <option key={o.documentId} value={o.documentId}>
                      {o.companyName} — ₹{((o.ctcAnnual || 0) / 100000).toFixed(1)}L
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Persona Cards */}
            <div style={sectionCard}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>HR Persona</label>
              {PERSONAS.map((p) => (
                <label
                  key={p.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    marginBottom: 8,
                    border: `1.5px solid ${persona === p.value ? p.color : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: persona === p.value ? p.bg : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name="persona"
                    value={p.value}
                    checked={persona === p.value}
                    onChange={() => setPersona(p.value)}
                    style={{ accentColor: p.color, marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {p.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              className="btn btn-primary"
              onClick={handleStart}
              disabled={!offerId}
              style={{ width: '100%', fontSize: 14 }}
            >
              {messages.length > 0 ? '🔄 Restart Negotiation' : '▶️ Start Negotiation'}
            </button>

            {!offerId && savedOffers.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Upload an offer letter in{' '}
                <a href="/documents" style={{ color: 'var(--primary)' }}>
                  Documents
                </a>{' '}
                first
              </p>
            )}
          </div>

          {/* Chat Window */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: 540,
              background: '#fff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>
                {selectedPersona?.label || '🎭 HR Role-Play'}
              </div>
              {messages.length > 0 && (
                <span
                  style={{
                    padding: '3px 12px',
                    background: turn > 4 ? 'var(--danger-light)' : 'var(--primary-light)',
                    color: turn > 4 ? 'var(--danger)' : 'var(--primary)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Turn {Math.min(turn, 5)} / 5
                </span>
              )}
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 44 }}>🎭</span>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>Ready to practice</p>
                  <p style={{ fontSize: 12 }}>Select an offer, pick your HR persona, then Start</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: 8,
                      alignItems: 'flex-end',
                    }}
                  >
                    {msg.role !== 'user' && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        🤖
                      </div>
                    )}
                    <div
                      style={{
                        maxWidth: '78%',
                        padding: '10px 14px',
                        borderRadius:
                          msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background:
                          msg.role === 'user' ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                        fontSize: 13.5,
                        lineHeight: 1.55,
                      }}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        👤
                      </div>
                    )}
                  </div>
                ))
              )}
              {loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    🤖
                  </div>
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: '16px 16px 16px 4px',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-subtle)',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                  placeholder={
                    messages.length === 0
                      ? 'Start the negotiation first...'
                      : isComplete
                      ? 'Negotiation complete — check your scorecard!'
                      : 'Your response to the HR...'
                  }
                  disabled={!offerId || messages.length === 0 || isComplete || loading}
                  style={{
                    ...inputStyle,
                    flex: 1,
                    background: messages.length === 0 || isComplete ? 'var(--bg-muted)' : '#fff',
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={loading || !userInput.trim() || !offerId || messages.length === 0 || isComplete}
                  style={{ flexShrink: 0 }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// NEGOTIATION SCORECARD
// ─────────────────────────────────────────────────────────────
export const NegotiationScorecard = ({ scorecard }) => {
  if (!scorecard) return null;

  const DIMENSIONS = [
    { key: 'assertiveness', label: 'Assertiveness', icon: '💪' },
    { key: 'professionalism', label: 'Professionalism', icon: '🤝' },
    { key: 'leverageUtilization', label: 'Leverage Used', icon: '⚖️' },
    { key: 'preparation', label: 'Preparation', icon: '📋' },
    { key: 'creativeProblemSolving', label: 'Creative Thinking', icon: '💡' },
  ];

  const total = scorecard.totalScore || 0;
  const scoreColor = total >= 75 ? 'var(--success)' : total >= 50 ? 'var(--warning)' : 'var(--danger)';
  const scoreBg = total >= 75 ? 'var(--success-light)' : total >= 50 ? 'var(--warning-light)' : 'var(--danger-light)';
  const scoreLabel = total >= 75 ? 'Excellent Negotiator' : total >= 50 ? 'Solid Performance' : 'Needs Practice';

  return (
    <div>
      {/* Score Hero */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '24px',
          background: scoreBg,
          border: `1px solid ${scoreColor}`,
          borderRadius: 'var(--radius-lg)',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: '#fff',
            border: `4px solid ${scoreColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>
            🏆 Negotiation Complete
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: scoreColor,
              marginTop: 4,
            }}
          >
            {scoreLabel}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Review your dimension scores and improvement tips below
          </div>
        </div>
      </div>

      {/* Dimension Progress Bars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {DIMENSIONS.map((dim) => {
          const score = scorecard.scores?.[dim.key] || 0;
          const pct = Math.min((score / 20) * 100, 100);
          return (
            <div
              key={dim.key}
              style={{
                background: '#fff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                  {dim.icon} {dim.label}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                  }}
                >
                  {score}/20
                </span>
              </div>
              <div
                style={{
                  height: 7,
                  background: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background:
                      pct >= 75
                        ? 'linear-gradient(90deg, #059669, #34d399)'
                        : pct >= 50
                        ? 'linear-gradient(90deg, #d97706, #fbbf24)'
                        : 'linear-gradient(90deg, #dc2626, #f87171)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {scorecard.feedback && (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 18,
            marginBottom: 14,
          }}
        >
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700 }}>📝 Coach Feedback</h4>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {scorecard.feedback}
          </p>
        </div>
      )}

      {/* Improved Phrasing */}
      {scorecard.improvedPhrasing?.length > 0 && (
        <div
          style={{
            background: 'var(--success-light)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            marginBottom: 14,
          }}
        >
          <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>
            ✨ Stronger Phrasing
          </h4>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-main)', fontSize: 13, lineHeight: 1.8 }}>
            {scorecard.improvedPhrasing.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missed Opportunities */}
      {scorecard.missedOpportunities?.length > 0 && (
        <div
          style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}
        >
          <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>
            🎯 Missed Opportunities
          </h4>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-main)', fontSize: 13, lineHeight: 1.8 }}>
            {scorecard.missedOpportunities.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default { CompareOffers, EsopCalculator, CounterEmail, HrRoleplay, NegotiationScorecard };
