import React, { useState } from 'react';
import './MoneyPlanPage.css';

const GOALS = [
  { id: 'home',      icon: '🏠', label: 'Home Fund',      target: 3000000, saved: 450000,  monthly: 25000 },
  { id: 'emergency', icon: '🛡️', label: 'Emergency Fund', target: 600000,  saved: 210000,  monthly: 10000 },
  { id: 'retire',    icon: '🌴', label: 'Retirement',     target: 15000000, saved: 800000, monthly: 15000 },
];

function calcMonths(target, saved, monthly) {
  if (monthly <= 0) return '—';
  const months = Math.ceil((target - saved) / monthly);
  if (months <= 0) return 'Done!';
  const yrs = Math.floor(months / 12);
  const mo  = months % 12;
  return yrs > 0 ? `${yrs}y ${mo}m` : `${mo}m`;
}

function HealthGauge({ score }) {
  const clr = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626';
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 120 70" className="gauge-svg">
        <path d="M10,65 A55,55 0 0,1 110,65" stroke="#e2e8f0" strokeWidth="12" fill="none" />
        <path
          d="M10,65 A55,55 0 0,1 110,65"
          stroke={clr}
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${(score / 100) * 173} 173`}
          strokeLinecap="round"
        />
      </svg>
      <div className="gauge-label" style={{ color: clr }}>
        {score}<span className="gauge-sub">/100</span>
      </div>
    </div>
  );
}

export default function MoneyPlanPage() {
  const [loanAmount, setLoanAmount] = useState(2000000);
  const [loanRate, setLoanRate]     = useState(8.5);
  const [prepay, setPrepay]         = useState(200000);

  const monthlyRate = loanRate / 100 / 12;
  const tenure      = 240; // 20 years
  const emi = loanAmount > 0
    ? Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1))
    : 0;

  const totalInterest   = emi * tenure - loanAmount;
  const prepayedRemain  = Math.max(0, loanAmount - prepay);
  const newEmi = prepayedRemain > 0
    ? Math.round((prepayedRemain * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1))
    : 0;
  const interestSaved = (emi - newEmi) * tenure;

  return (
    <div className="moneyplan-page">
      <div className="mp-header">
        <div>
          <h2>Money Plan</h2>
          <p>Financial health scoring, goal planning, and loan payoff analysis.</p>
        </div>
      </div>

      {/* Health Score */}
      <div className="mp-row">
        <div className="mp-card health-card">
          <h3 className="card-heading">Financial Health Score</h3>
          <HealthGauge score={72} />
          <ul className="health-factors">
            <li><span className="hf-good">✅</span> Savings rate &gt; 15%</li>
            <li><span className="hf-warn">⚠️</span> EMI/Income ratio high (38%)</li>
            <li><span className="hf-good">✅</span> Emergency fund: 3.5 months</li>
            <li><span className="hf-bad">❌</span> 80C gap: ₹50,000 remaining</li>
          </ul>
        </div>

        {/* Goal Planner */}
        <div className="mp-card goals-card">
          <h3 className="card-heading">Goal Planner</h3>
          <div className="goals-list">
            {GOALS.map((g) => {
              const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
              return (
                <div key={g.id} className="goal-item">
                  <div className="goal-top">
                    <span className="goal-icon">{g.icon}</span>
                    <span className="goal-label">{g.label}</span>
                    <span className="goal-eta">ETA: {calcMonths(g.target, g.saved, g.monthly)}</span>
                  </div>
                  <div className="goal-bar-bg">
                    <div className="goal-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="goal-bottom">
                    <span>₹{(g.saved / 100000).toFixed(1)}L saved</span>
                    <span>{pct}%</span>
                    <span>Target ₹{(g.target / 100000).toFixed(0)}L</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loan Simulator */}
      <div className="mp-card">
        <h3 className="card-heading">Loan &amp; Prepayment Simulator</h3>
        <div className="loan-form">
          <label className="neg-label">
            Loan Amount (₹)
            <input
              id="loan-amount"
              type="range"
              min={500000}
              max={10000000}
              step={100000}
              value={loanAmount}
              className="ctc-slider"
              onChange={(e) => setLoanAmount(Number(e.target.value))}
            />
            <span className="ctc-value">₹{(loanAmount / 100000).toFixed(0)}L</span>
          </label>
          <label className="neg-label">
            Interest Rate (%)
            <input
              id="loan-rate"
              type="number"
              step={0.1}
              min={5}
              max={18}
              className="neg-input"
              value={loanRate}
              onChange={(e) => setLoanRate(Number(e.target.value))}
            />
          </label>
          <label className="neg-label">
            One-time Prepayment (₹)
            <input
              id="loan-prepay"
              type="number"
              step={10000}
              className="neg-input"
              value={prepay}
              onChange={(e) => setPrepay(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="loan-results">
          <div className="loan-result-item">
            <span className="lr-label">Monthly EMI (no prepay)</span>
            <span className="lr-value">₹{emi.toLocaleString('en-IN')}</span>
          </div>
          <div className="loan-result-item">
            <span className="lr-label">Total Interest Payable</span>
            <span className="lr-value red">₹{totalInterest.toLocaleString('en-IN')}</span>
          </div>
          {prepay > 0 && (
            <div className="loan-result-item green-row">
              <span className="lr-label">Interest Saved by Prepay</span>
              <span className="lr-value green">~₹{Math.abs(interestSaved).toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
