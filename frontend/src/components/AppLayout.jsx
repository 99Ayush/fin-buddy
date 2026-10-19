import React, { useState, createContext, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

// Toast Context for professional notification toasts instead of alert()
const ToastContext = createContext({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

// Global settings context for language and explanation depth
const SettingsContext = createContext({
  lang: 'en',
  setLang: () => {},
  depth: 'fresher',
  setDepth: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const AppLayout = ({ children }) => {
  const [lang, setLang] = useState('en');
  const [depth, setDepth] = useState('fresher');
  const [toasts, setToasts] = useState([]);
  const location = useLocation();

  const showToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // P1 = live; P2/P3 = under development
  const navLinks = [
    { to: '/documents', label: lang === 'hi' ? 'दस्तावेज़' : 'Documents', icon: '📄', tier: 'p1' },
    { to: '/offers',    label: lang === 'hi' ? 'ऑफ़र और बातचीत' : 'Offers & Negotiate', icon: '💼', tier: 'p1' },
    { to: '/salarytax', label: lang === 'hi' ? 'वेतन और कर' : 'Salary & Tax', icon: '💰', tier: 'p2' },
    { to: '/moneyplan', label: lang === 'hi' ? 'वित्तीय योजना' : 'Money Plan', icon: '📈', tier: 'p2' },
    { to: '/assistant', label: lang === 'hi' ? 'एआई सहायक' : 'Tax Assistant', icon: '🤖', tier: 'p3' },
  ];

  return (
    <SettingsContext.Provider value={{ lang, setLang, depth, setDepth }}>
      <ToastContext.Provider value={{ showToast }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Top Navigation Bar */}
          <header className="app-navbar">
            <div className="app-container navbar-inner">
              <NavLink to="/documents" className="nav-brand">
                <div className="brand-icon">₹</div>
                <span>Fin-Buddy</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    borderRadius: 9999,
                    fontWeight: 700,
                  }}
                >
                  P1 Live
                </span>
              </NavLink>

              <nav className="nav-links">
                {/* P1 items */}
                {navLinks
                  .filter((item) => item.tier === 'p1')
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}

                {/* Divider */}
                <span
                  style={{
                    width: 1,
                    height: 24,
                    background: 'var(--border-subtle)',
                    margin: '0 6px',
                    flexShrink: 0,
                  }}
                />

                {/* P2/P3 items — dimmed, with "Soon" badge */}
                {navLinks
                  .filter((item) => item.tier === 'p2' || item.tier === 'p3')
                  .map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                      style={{ opacity: 0.5 }}
                      title={`Under development by ${item.tier.toUpperCase()} team`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <span
                        style={{
                          fontSize: 9,
                          padding: '1px 5px',
                          background: '#fef9c3',
                          color: '#854d0e',
                          border: '1px solid #fde047',
                          borderRadius: 9999,
                          fontWeight: 700,
                        }}
                      >
                        Soon
                      </span>
                    </NavLink>
                  ))}
              </nav>

              <div className="nav-controls">
                {/* Language Toggle */}
                <div className="pill-toggle">
                  <button
                    type="button"
                    className={`pill-option ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => setLang('en')}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={`pill-option ${lang === 'hi' ? 'active' : ''}`}
                    onClick={() => setLang('hi')}
                  >
                    हिन्दी
                  </button>
                </div>

                {/* Depth Toggle (Fresher / Veteran) */}
                <div className="pill-toggle">
                  <button
                    type="button"
                    className={`pill-option ${depth === 'fresher' ? 'active' : ''}`}
                    onClick={() => setDepth('fresher')}
                    title="Simple plain-English explanations"
                  >
                    Fresher
                  </button>
                  <button
                    type="button"
                    className={`pill-option ${depth === 'veteran' ? 'active' : ''}`}
                    onClick={() => setDepth('veteran')}
                    title="In-depth legal & statutory tax explanations"
                  >
                    Veteran
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main style={{ flex: 1 }}>
            {children}
          </main>

          {/* Educational Disclaimer Footer */}
          <footer style={{ background: '#ffffff', borderTop: '1px solid var(--border-subtle)', padding: '24px 0', marginTop: 'auto' }}>
            <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div>
                <strong>Fin-Buddy</strong> &bull; Educational financial clarity only. Strictly not SEBI-registered financial or legal advice.
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>🔒 Local PII Redaction Guaranteed</span>
                <span>Deterministic Code Calculations</span>
              </div>
            </div>
          </footer>

          {/* Floating Toasts */}
          <div className="toast-container">
            {toasts.map((toast) => (
              <div key={toast.id} className={`toast toast-${toast.type}`}>
                <span style={{ fontSize: '18px' }}>
                  {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span style={{ flex: 1 }}>{toast.message}</span>
              </div>
            ))}
          </div>
        </div>
      </ToastContext.Provider>
    </SettingsContext.Provider>
  );
};
