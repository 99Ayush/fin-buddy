/**
 * Home Page — Fin-Buddy Dashboard
 * Professional FinTech landing page with hero, stats, feature cards, and how-it-works section.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ icon, title, bullets, ctaLabel, ctaHref, accent, comingSoon }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        boxShadow: hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.22s ease',
        position: 'relative',
        overflow: 'hidden',
        opacity: comingSoon ? 0.78 : 1,
      }}
    >
      {/* Accent top strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: accent,
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      />

      {comingSoon && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '3px 10px',
            background: '#fef9c3',
            color: '#854d0e',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
            fontWeight: 700,
            border: '1px solid #fde047',
          }}
        >
          Coming Soon
        </div>
      )}

      <div style={{ fontSize: 36, marginBottom: 12, marginTop: 10 }}>{icon}</div>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 10px' }}>
        {title}
      </h3>
      <ul style={{ margin: '0 0 20px', paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.9 }}>
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      {ctaHref && !comingSoon ? (
        <Link
          to={ctaHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            background: accent,
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 13,
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          {ctaLabel} →
        </Link>
      ) : comingSoon ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Notify Me →
        </span>
      ) : null}
    </div>
  );
};

const StatCard = ({ icon, value, label }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 'var(--radius-md)',
      padding: '20px 24px',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: 500 }}>
      {label}
    </div>
  </div>
);

const HomePage = () => (
  <div style={{ fontFamily: 'var(--font-sans)' }}>
    {/* ── Hero ─────────────────────────────────────────────── */}
    <section
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)',
        padding: '72px 24px 60px',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 16px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 600,
            marginBottom: 24,
            backdropFilter: 'blur(8px)',
          }}
        >
          🇮🇳 Built for Indian professionals · 100% local PII protection
        </div>

        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 52px)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            margin: '0 0 20px',
          }}
        >
          Your Financial
          <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #a5b4fc, #67e8f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Clarity Engine
          </span>
        </h1>

        <p
          style={{
            fontSize: 17,
            color: 'rgba(255,255,255,0.72)',
            margin: '0 auto 36px',
            maxWidth: 600,
            lineHeight: 1.65,
          }}
        >
          Decode offer letters · Compare packages · Master negotiations · Know your taxes
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Link
            to="/documents"
            style={{
              padding: '13px 28px',
              background: '#fff',
              color: '#312e81',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
              transition: 'transform 0.15s',
            }}
          >
            📄 Analyze My Offer Letter
          </Link>
          <Link
            to="/offers"
            style={{
              padding: '13px 28px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            ⚡ Compare Offers
          </Link>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            maxWidth: 700,
            margin: '0 auto',
          }}
        >
          <StatCard icon="🔒" value="₹0" label="Stored in cloud" />
          <StatCard icon="📐" value="100%" label="Deterministic math" />
          <StatCard icon="🚩" value="7" label="Trap types detected" />
          <StatCard icon="📊" value="3" label="ESOP scenarios" />
        </div>
      </div>
    </section>

    {/* ── Trust Badges ─────────────────────────────────────── */}
    <section
      style={{
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: 32,
          flexWrap: 'wrap',
        }}
      >
        {[
          { icon: '🔐', text: 'Local PII Redaction — never sent raw' },
          { icon: '📐', text: 'Code calculates, AI only explains' },
          { icon: '🎓', text: 'SEBI-safe educational use' },
          { icon: '🛡️', text: 'No cloud storage of your documents' },
        ].map((b) => (
          <div
            key={b.text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            <span>{b.icon}</span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>
    </section>

    {/* ── Feature Cards ────────────────────────────────────── */}
    <section style={{ padding: '60px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', margin: '0 0 10px' }}>
            Everything you need to negotiate with confidence
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>
            Purpose-built tools for India's tech workforce — from campus hires to senior ICs
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <FeatureCard
            icon="📄"
            title="Offer Letter Intelligence"
            accent="var(--primary)"
            bullets={[
              'PII redaction audit before any AI call',
              '7 predatory clause detectors (bond, moonlighting, NDA...)',
              'Monthly net in-hand with Old vs New regime',
              'Severity-ranked risk flags with negotiation playbook',
            ]}
            ctaLabel="Upload Document"
            ctaHref="/documents"
          />
          <FeatureCard
            icon="💼"
            title="Offer Comparison & Negotiation"
            accent="#059669"
            bullets={[
              'Side-by-side multi-offer comparison matrix',
              'ESOP Bear / Base / Bull exit scenarios',
              'Counter-offer email generator with 3 tone profiles',
              'AI HR role-play with 5-dimension scorecard',
            ]}
            ctaLabel="Compare Offers"
            ctaHref="/offers"
          />
          <FeatureCard
            icon="💰"
            title="Salary & Tax Calculator"
            accent="#d97706"
            bullets={[
              'Old vs New regime in-hand comparison',
              'Section 80C / 80D / 80CCD optimization',
              'Monthly take-home projections',
              'Form 16 auto-fill & payslip audit',
            ]}
            comingSoon
          />
          <FeatureCard
            icon="📊"
            title="Financial Health & Goals"
            accent="#7c3aed"
            bullets={[
              'Financial health score (0–100)',
              'Goal-based SIP planner with timeline',
              'Debt / EMI payoff optimizer',
              'Net worth dashboard & emergency fund tracker',
            ]}
            comingSoon
          />
        </div>
      </div>
    </section>

    {/* ── How It Works ─────────────────────────────────────── */}
    <section
      style={{
        background: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '60px 24px',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
            How It Works
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Three steps from document to negotiation-ready
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            position: 'relative',
          }}
        >
          {/* Connecting line */}
          <div
            style={{
              position: 'absolute',
              top: 36,
              left: '16.67%',
              right: '16.67%',
              height: 2,
              background: 'linear-gradient(90deg, var(--primary), #059669)',
              zIndex: 0,
            }}
          />

          {[
            { step: '01', icon: '📤', title: 'Upload', desc: 'Drop your offer letter PDF or paste the text. Choose offer letter or payslip type.' },
            { step: '02', icon: '🔍', title: 'Analyze', desc: 'PII is redacted locally. We extract salary breakdown, trap clauses, and risk flags with severity.' },
            { step: '03', icon: '🤝', title: 'Negotiate', desc: 'Compare packages, generate counter emails, practice with AI HR, and enter the room prepared.' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '0 24px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--primary)' : i === 1 ? '#7c3aed' : '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: 28,
                  boxShadow: 'var(--shadow-md)',
                  border: '4px solid #fff',
                }}
              >
                {item.icon}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 8px' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Quick Start CTA ──────────────────────────────────── */}
    <section style={{ padding: '52px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
          Ready to take control of your compensation?
        </h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '0 0 28px' }}>
          No sign-up required. Your documents never leave your browser unredacted.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/documents"
            style={{
              padding: '12px 26px',
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}
          >
            📄 Analyze Offer Letter
          </Link>
          <Link
            to="/offers"
            style={{
              padding: '12px 26px',
              background: '#fff',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            ⚖️ Compare Offers
          </Link>
        </div>
      </div>
    </section>

    {/* ── SEBI Footer Disclaimer ───────────────────────────── */}
    <div
      style={{
        background: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-muted)',
      }}
    >
      🛡️ Fin-Buddy is an educational tool only. Not registered with SEBI. All salary & tax calculations are deterministic code — never trusted to AI outputs.
    </div>
  </div>
);

export default HomePage;