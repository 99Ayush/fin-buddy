import React, { useState, createContext, useContext, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  const [lang, setLang]   = useState('en');
  const [depth, setDepth] = useState('fresher');
  const [toasts, setToasts]         = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const showToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  // All currently registered modules are available in the app.
  const navLinks = [
    { to: '/home',      label: lang === 'hi' ? 'होम' : 'Home',                 icon: '🏠', tier: 'p3-live' },
    { to: '/documents', label: lang === 'hi' ? 'दस्तावेज़' : 'Documents',        icon: '📄', tier: 'p1' },
    { to: '/salarytax', label: lang === 'hi' ? 'वेतन और कर' : 'Salary & Tax',    icon: '💰', tier: 'live' },
    { to: '/moneyplan', label: lang === 'hi' ? 'वित्तीय योजना' : 'Money Plan',    icon: '📈', tier: 'live' },
    { to: '/offers',    label: lang === 'hi' ? 'ऑफ़र और बातचीत' : 'Offers & Negotiate', icon: '💼', tier: 'p1' },
    { to: '/assistant', label: lang === 'hi' ? 'एआई सहायक' : 'Help Bot',         icon: '🤖', tier: 'p3-live' },
  ];

  return (
    <SettingsContext.Provider value={{ lang, setLang, depth, setDepth }}>
      <ToastContext.Provider value={{ showToast }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Top Navigation Bar */}
          <header className="app-navbar">
            <div className="app-container navbar-inner">
              <NavLink to="/home" className="nav-brand" aria-label="Fin-Buddy home">
                <span>fin-buddy</span>
              </NavLink>

              <nav className="nav-links">
                {/* Available tools */}
                {navLinks
                    .filter((item) => item.tier === 'p1' || item.tier === 'p3-live' || item.tier === 'live')
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
              </nav>

              <div className="nav-controls">
                {/* Profile Button */}
                {user && (
                  <div className="profile-menu" ref={profileRef}>
                    <button
                      id="btn-profile"
                      className="profile-avatar"
                      onClick={() => setProfileOpen(o => !o)}
                      aria-label="Your profile"
                      title={user.name}
                    >
                      {user.name?.[0]?.toUpperCase() || '⚙️'}
                    </button>
                    {profileOpen && (
                      <div className="profile-dropdown">
                        <div className="profile-dropdown-header">
                          <div className="profile-avatar-lg">{user.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p className="profile-name">{user.name}</p>
                            <p className="profile-email">{user.email}</p>
                          </div>
                        </div>
                        <div className="profile-dropdown-body">
                          <div className="profile-field">
                            <span className="profile-field-label">User ID</span>
                            <span className="profile-field-value profile-id">{user.id}</span>
                          </div>
                          <div className="profile-field">
                            <span className="profile-field-label">Member since</span>
                            <span className="profile-field-value">
                              {new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                            </span>
                          </div>
                        </div>
                        <button
                          id="btn-logout"
                          className="profile-logout"
                          onClick={handleLogout}
                        >
                          🚪 Sign out
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
