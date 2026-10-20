import React, { useState } from 'react';
import './SalaryTaxPage.css';

const OLD_SLABS = [
  { upto: 250000, rate: 0 },
  { upto: 500000, rate: 0.05 },
  { upto: 1000000, rate: 0.2 },
  { upto: Infinity, rate: 0.3 },
];
const NEW_SLABS = [
  { upto: 300000, rate: 0 },
  { upto: 700000, rate: 0.05 },
  { upto: 1000000, rate: 0.1 },
  { upto: 1200000, rate: 0.15 },
  { upto: 1500000, rate: 0.2 },
  { upto: Infinity, rate: 0.3 },
];

function calcTax(income, slabs) {
  let tax = 0;
  let prev = 0;
  for (const s of slabs) {
    const taxable = Math.min(income, s.upto) - prev;
    if (taxable <= 0) break;
    tax += taxable * s.rate;
    prev = s.upto;
  }
  return Math.round(tax * 1.04); // +4% cess
}

const MOCK_CTC = 1050000;
const EPF = Math.round(MOCK_CTC * 0.072);
const PT  = 2400;
const GROSS = MOCK_CTC - EPF - PT;

export default function SalaryTaxPage() {
  const [ctc, setCtc] = useState(MOCK_CTC);
  const [deductions80C, setDeductions80C] = useState(100000);

  const epf   = Math.round(ctc * 0.072);
  const pt    = 2400;
  const gross = ctc - epf - pt;
  const inHandMonthly = Math.round(gross / 12);

  const oldTaxableIncome = Math.max(0, ctc - epf - Math.min(deductions80C, 150000) - 50000);
  const newTaxableIncome = Math.max(0, ctc - epf);

  const oldTax = calcTax(oldTaxableIncome, OLD_SLABS);
  const newTax = calcTax(newTaxableIncome, NEW_SLABS);
  const saving  = oldTax - newTax;

  const gap80C = Math.max(0, 150000 - deductions80C);

  return (
    <div className="salary-tax-page">
      <div className="st-header">
        <div>
          <h2>Salary &amp; Tax</h2>
          <p>Calculate your real in-hand salary and compare tax regimes.</p>
        </div>
      </div>

      {/* CTC Slider */}
      <div className="st-card">
        <h3 className="card-heading">Your CTC</h3>
        <div className="slider-row">
          <input
            id="ctc-slider"
            type="range"
            min={300000}
            max={5000000}
            step={50000}
            value={ctc}
            className="ctc-slider"
            onChange={(e) => setCtc(Number(e.target.value))}
          />
          <span className="ctc-value">₹{(ctc / 100000).toFixed(1)} LPA</span>
        </div>
      </div>

      {/* In-Hand Breakdown */}
      <div className="st-card">
        <h3 className="card-heading">Monthly In-Hand Breakdown</h3>
        <div className="breakdown-grid">
          {[
            { label: 'Annual CTC',       value: `₹${(ctc/100000).toFixed(1)} LPA`,      sub: '' },
            { label: 'EPF (12%)',         value: `−₹${(epf/1000).toFixed(1)}K /yr`,      sub: 'Employee contribution' },
            { label: 'Professional Tax',  value: `−₹${pt.toLocaleString('en-IN')} /yr`,  sub: 'State deduction' },
            { label: 'Monthly In-Hand',   value: `₹${inHandMonthly.toLocaleString('en-IN')}`, sub: 'Approx, pre-TDS', highlight: true },
          ].map((item) => (
            <div key={item.label} className={`breakdown-item ${item.highlight ? 'highlight-item' : ''}`}>
              <p className="bi-label">{item.label}</p>
              <p className="bi-value">{item.value}</p>
              {item.sub && <p className="bi-sub">{item.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Tax Regime Comparator */}
      <div className="st-card">
        <h3 className="card-heading">Tax Regime Comparator</h3>
        <div className="regime-row">
          <div className={`regime-col ${newTax < oldTax ? 'regime-winner' : ''}`}>
            <span className="regime-name">New Regime</span>
            {newTax < oldTax && <span className="winner-badge">✨ Better</span>}
            <span className="regime-tax">₹{newTax.toLocaleString('en-IN')}</span>
            <span className="regime-label">Tax Payable</span>
          </div>
          <div className="regime-vs">vs</div>
          <div className={`regime-col ${oldTax <= newTax ? 'regime-winner' : ''}`}>
            <span className="regime-name">Old Regime</span>
            {oldTax <= newTax && <span className="winner-badge">✨ Better</span>}
            <span className="regime-tax">₹{oldTax.toLocaleString('en-IN')}</span>
            <span className="regime-label">Tax Payable</span>
          </div>
        </div>
        {saving !== 0 && (
          <p className="saving-note">
            {saving > 0
              ? `New regime saves you ₹${saving.toLocaleString('en-IN')} this year.`
              : `Old regime saves you ₹${Math.abs(saving).toLocaleString('en-IN')} this year (with deductions).`}
          </p>
        )}
      </div>

      {/* 80C Planner */}
      <div className="st-card">
        <h3 className="card-heading">80C &amp; Exemption Planner</h3>
        <div className="planner-row">
          <label className="neg-label" htmlFor="deductions-input">
            Current 80C Investments (₹)
            <input
              id="deductions-input"
              type="number"
              className="neg-input"
              value={deductions80C}
              onChange={(e) => setDeductions80C(Number(e.target.value))}
              max={150000}
              min={0}
            />
          </label>
          <div className="planner-bar-wrap">
            <div
              className="planner-bar-fill"
              style={{ width: `${Math.min(100, (deductions80C / 150000) * 100)}%` }}
            />
          </div>
          <p className="planner-status">
            {gap80C > 0
              ? `⚠️ You have ₹${gap80C.toLocaleString('en-IN')} of unused 80C room. Invest in ELSS, PPF, or LIC.`
              : '✅ 80C limit fully utilised (₹1.5 L)!'}
          </p>
        </div>
      </div>
    </div>
  );
}
