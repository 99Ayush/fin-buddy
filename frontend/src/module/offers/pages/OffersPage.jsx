/**
 * Offers Module — OffersPage.jsx
 * 4-tab container: Compare → ESOP Calculator → Counter Email → HR Role-Play
 */

import React, { useState } from 'react';
import { useToast } from '../../../components/AppLayout';
import { useSettings } from '../../../components/AppLayout';
import { CompareOffers, EsopCalculator, CounterEmail, HrRoleplay } from '../components';
import * as i18n from '../i18n';

const DEMO_OFFERS = [
  { companyName: 'Swiggy', ctcAnnual: 2400000, baseSalary: 1440000, hra: 720000, variableBonus: 240000, noticePeriod: 90, bondAmount: 0 },
  { companyName: 'Google India', ctcAnnual: 3200000, baseSalary: 2000000, hra: 900000, variableBonus: 300000, noticePeriod: 60, bondAmount: 0 },
  { companyName: 'Razorpay', ctcAnnual: 2800000, baseSalary: 1680000, hra: 840000, variableBonus: 280000, noticePeriod: 60, bondAmount: 0 },
];

const TABS = [
  { id: 0, label: 'Compare Offers', icon: '⚖️', shortLabel: 'Compare' },
  { id: 1, label: 'ESOP Calculator', icon: '📈', shortLabel: 'ESOP' },
  { id: 2, label: 'Counter Email', icon: '✉️', shortLabel: 'Email' },
  { id: 3, label: 'HR Role-Play', icon: '🎭', shortLabel: 'Role-Play' },
];

const OffersPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [savedOffers, setSavedOffers] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [demoOffers, setDemoOffers] = useState(null);
  const [comparing, setComparing] = useState(false);

  const { showToast } = useToast();
  const { lang } = useSettings();

  const t = (key) => i18n.t(key, lang, 'fresher');

  const loadSavedOffers = async () => {
    try {
      const userId = localStorage.getItem('fin_user_id') || 'default-user';
      const res = await fetch('/api/offers/my-offers', { headers: { 'x-user-id': userId } });
      const data = await res.json();
      if (data.success) setSavedOffers(data.offers);
    } catch (e) {
      console.error('Failed to load offers:', e);
    }
  };

  const handleCompare = async (offers) => {
    setComparing(true);
    try {
      const userId = localStorage.getItem('fin_user_id') || 'default-user';
      const res = await fetch('/api/offers/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ manualOffers: offers }),
      });
      const data = await res.json();
      if (data.success) {
        setComparisonResult(data);
        showToast('Comparison complete! See results below.', 'success');
      } else {
        showToast('Comparison failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      showToast('Comparison failed: ' + e.message, 'error');
    }
    setComparing(false);
  };

  const handleLoadDemo = () => {
    setDemoOffers(DEMO_OFFERS);
    setActiveTab(0);
    showToast('⚡ 3 demo tech offers loaded — click Compare!', 'success');
  };

  return (
    <div
      className="app-container page-wrapper"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className="page-title">💼 Offers &amp; Negotiate</h1>
            <span
              style={{
                padding: '3px 10px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              P1 Core
            </span>
          </div>
          <p className="page-subtitle">
            Compare offers side-by-side, value your ESOPs, generate negotiation emails, and practice with an AI HR recruiter.
          </p>
        </div>
        <button
          className="btn btn-success"
          onClick={handleLoadDemo}
          style={{ flexShrink: 0, fontSize: 14 }}
        >
          ⚡ Load 3 Demo Tech Offers
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-header">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="panel-card"
        style={{ minHeight: 520 }}
      >
        <div className="panel-body">
          {activeTab === 0 && (
            <CompareOffers
              savedOffers={savedOffers}
              onLoadOffers={loadSavedOffers}
              onCompare={handleCompare}
              comparisonResult={comparisonResult}
              comparing={comparing}
              demoOffers={demoOffers}
              showToast={showToast}
            />
          )}
          {activeTab === 1 && <EsopCalculator showToast={showToast} />}
          {activeTab === 2 && <CounterEmail savedOffers={savedOffers} showToast={showToast} />}
          {activeTab === 3 && <HrRoleplay savedOffers={savedOffers} showToast={showToast} />}
        </div>
      </div>

      {/* SEBI Disclaimer */}
      <p
        style={{
          marginTop: 16,
          fontSize: 12,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        🛡️ Educational financial clarity only — not SEBI-registered financial or legal advice. All salary maths are deterministic code.
      </p>
    </div>
  );
};

export default OffersPage;
