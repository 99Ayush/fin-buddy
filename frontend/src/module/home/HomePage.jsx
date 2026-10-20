import React, { useState } from 'react';
import './HomePage.css';

const MOCK_SNAPSHOT = {
  healthScore: 72,
  inHand: '₹68,400',
  savings: '₹12,300',
  taxSaved: '₹18,500',
};

const MOCK_TIMELINE = [
  { year: '2021', event: 'Joined Infosys', type: 'job', ctc: '₹5.2 LPA' },
  { year: '2022', event: 'Hike → ₹6.4 LPA', type: 'raise', ctc: '₹6.4 LPA' },
  { year: '2023', event: 'Offer — Wipro', type: 'offer', ctc: '₹8.0 LPA' },
  { year: '2024', event: 'Joined TCS', type: 'job', ctc: '₹9.1 LPA' },
  { year: '2025', event: 'Hike → ₹10.5 LPA', type: 'raise', ctc: '₹10.5 LPA' },
];

const MOCK_MOVERS = [
  { name: 'Reliance', change: '+3.4%', up: true },
  { name: 'Infosys', change: '+2.1%', up: true },
  { name: 'HDFC Bank', change: '-1.8%', up: false },
  { name: 'TCS', change: '+1.2%', up: true },
  { name: 'Wipro', change: '-0.9%', up: false },
];

const ACTIONS = [
  { icon: '📄', text: 'Upload your latest payslip', route: '/documents' },
  { icon: '⚖️', text: 'Compare old vs new tax regime', route: '/salary-tax' },
  { icon: '🏦', text: 'Check your 80C gap', route: '/salary-tax' },
  { icon: '💬', text: 'Ask the AI about Form 16', route: '/ask' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-text">
          <span className="home-pill">🇮🇳 AI Financial Companion</span>
          <h2>Your Financial Dashboard</h2>
          <p>
            Get a real-time snapshot of your income, taxes, savings, and career — all
            in one place, powered by your own documents.
          </p>
          <div className="home-hero-actions">
            <a href="/documents" className="btn-primary">Upload Documents</a>
            <a href="/ask" className="btn-outline">Ask the AI</a>
          </div>
        </div>
        <div className="home-score-ring">
          <svg viewBox="0 0 120 120" className="ring-svg">
            <circle cx="60" cy="60" r="52" className="ring-track" />
            <circle
              cx="60" cy="60" r="52"
              className="ring-fill"
              strokeDasharray={`${(MOCK_SNAPSHOT.healthScore / 100) * 327} 327`}
              strokeDashoffset="82"
            />
          </svg>
          <div className="ring-label">
            <span className="ring-score">{MOCK_SNAPSHOT.healthScore}</span>
            <span className="ring-sub">Financial Health</span>
          </div>
        </div>
      </section>

      {/* Snapshot Cards */}
      <section className="home-section">
        <h3 className="section-title">Financial Snapshot</h3>
        <div className="snap-grid">
          {[
            { label: 'Monthly In-Hand', value: MOCK_SNAPSHOT.inHand, icon: '💰', color: 'green' },
            { label: 'Monthly Savings', value: MOCK_SNAPSHOT.savings, icon: '🏦', color: 'blue' },
            { label: 'Tax Saved (YTD)', value: MOCK_SNAPSHOT.taxSaved, icon: '🧾', color: 'purple' },
          ].map((item) => (
            <div key={item.label} className={`snap-card snap-${item.color}`}>
              <span className="snap-icon">{item.icon}</span>
              <div>
                <p className="snap-label">{item.label}</p>
                <p className="snap-value">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next-Best Actions */}
      <section className="home-section">
        <h3 className="section-title">Next-Best Actions</h3>
        <div className="actions-list">
          {ACTIONS.map((a) => (
            <a key={a.text} href={a.route} className="action-item">
              <span className="action-icon">{a.icon}</span>
              <span className="action-text">{a.text}</span>
              <span className="action-arrow">→</span>
            </a>
          ))}
        </div>
      </section>

      {/* Career Timeline */}
      <section className="home-section">
        <h3 className="section-title">Career Timeline</h3>
        <div className="timeline">
          {MOCK_TIMELINE.map((item, i) => (
            <div key={i} className={`tl-item tl-${item.type}`}>
              <div className="tl-dot" />
              <div className="tl-content">
                <span className="tl-year">{item.year}</span>
                <span className="tl-event">{item.event}</span>
                <span className="tl-ctc">{item.ctc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Market Movers */}
      <section className="home-section">
        <h3 className="section-title">
          Market Movers <span className="disclaimer-badge">Educational only</span>
        </h3>
        <div className="movers-row">
          {MOCK_MOVERS.map((m) => (
            <div key={m.name} className={`mover-chip ${m.up ? 'up' : 'down'}`}>
              <span className="mover-name">{m.name}</span>
              <span className="mover-change">{m.change}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
