/**
 * Tax Assistant Page — Under Development by P3 Team
 */
import React from 'react';
import { Link } from 'react-router-dom';

const AssistantPage = () => (
  <div
    className="app-container"
    style={{
      fontFamily: 'var(--font-sans)',
      minHeight: 'calc(100vh - 130px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}
  >
    <div
      style={{
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
          border: '2px solid #c7d2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          margin: '0 auto 28px',
          boxShadow: '0 8px 24px rgba(79,70,229,0.12)',
        }}
      >
        🤖
      </div>

      {/* Team Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 14px',
          background: '#fef9c3',
          color: '#854d0e',
          border: '1px solid #fde047',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 20,
          letterSpacing: '0.03em',
        }}
      >
        ⚙️ UNDER DEVELOPMENT · P3 TEAM
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: 'var(--text-main)',
          letterSpacing: '-0.03em',
          margin: '0 0 14px',
        }}
      >
        Tax Assistant
      </h1>

      <p
        style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          margin: '0 0 32px',
        }}
      >
        This module is currently being built by the <strong>P3 team</strong>.
        It will be a CA-reviewed conversational AI assistant with document
        context, voice support, and real-time Indian tax law Q&amp;A.
      </p>

      {/* Features Preview */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          textAlign: 'left',
          marginBottom: 28,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 12px',
          }}
        >
          Planned by P3
        </p>
        {[
          '🧠 CA-reviewed answers on Indian income tax laws',
          '📄 Document context — ask questions about your offer',
          '🎙️ Voice input & text-to-speech support',
          '🌐 Bilingual support (English & Hindi)',
          '📚 Section-by-section IT Act reference lookup',
        ].map((f) => (
          <div
            key={f}
            style={{
              fontSize: 13.5,
              color: 'var(--text-secondary)',
              padding: '7px 0',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* CTA back to P1 */}
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
        In the meantime, use our live P1 tools:
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/documents" className="btn btn-primary" style={{ fontSize: 13 }}>
          📄 Analyze Offer Letter
        </Link>
        <Link to="/offers" className="btn btn-secondary" style={{ fontSize: 13 }}>
          ⚖️ Compare Offers
        </Link>
      </div>

      <p style={{ marginTop: 28, fontSize: 12, color: 'var(--text-muted)' }}>
        🛡️ Educational financial clarity only — not SEBI-registered financial or legal advice.
      </p>
    </div>
  </div>
);

export default AssistantPage;