import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import HomePage      from './module/home/HomePage';
import AssistantPage from './module/assistant/AssistantPage';
import DocumentsPage from './module/documents/DocumentsPage';
import OffersPage    from './module/offers/OffersPage';
import SalaryTaxPage from './module/salarytax/SalaryTaxPage';
import MoneyPlanPage from './module/moneyplan/MoneyPlanPage';
import LoginPage     from './module/auth/LoginPage';
import RegisterPage  from './module/auth/RegisterPage';

/**
 * Redirects to /login if the user is not authenticated.
 * Shows nothing while the session is being restored (loading=true).
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // splash could go here
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-container">
          <NavLink to="/" className="brand-wrapper">
            <div className="brand-icon">₹</div>
            <div className="brand-text">
              <h1>Financial Adviser Buddy</h1>
              <span>Akumas • AI Financial Companion</span>
            </div>
          </NavLink>

          <nav className="nav-links" aria-label="Main Navigation">
            <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
            <NavLink to="/ask" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Ask &amp; CA Help
            </NavLink>
            <NavLink to="/documents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Documents
            </NavLink>
            <NavLink to="/offers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Offers &amp; Negotiate
            </NavLink>
            <NavLink to="/salary-tax" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Salary &amp; Tax
            </NavLink>
            <NavLink to="/money-plan" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Money Plan
            </NavLink>
          </nav>

          <div className="header-actions">
            <span className="tag-badge badge-neutral" title="Current Language">🌐 EN</span>
            <HeaderUser />
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p><strong>Financial Adviser Buddy (Akumas)</strong> &bull; AI Financial Companion for India</p>
        <p>Educational and analytical tools only. Does not constitute formal financial, legal, or tax advice.</p>
      </footer>
    </div>
  );
}

function HeaderUser() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <span className="tag-badge badge-p3" title="Signed in as">
        👤 {user.name.split(' ')[0]}
      </span>
      <button
        id="btn-logout"
        onClick={logout}
        style={{
          background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px',
          padding: '0.3rem 0.7rem', fontSize: '0.78rem', fontWeight: 600,
          color: '#475569', cursor: 'pointer', transition: 'background 0.15s'
        }}
        onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
        onMouseOut={(e)  => e.target.style.background = 'none'}
      >
        Sign out
      </button>
    </div>
  );
}


function NotFoundPage() {
  return (
    <div className="page-container">
      <div className="hero-banner">
        <h2>404 — Page Not Found</h2>
        <p>The requested route does not exist.</p>
        <div style={{ marginTop: '1rem' }}>
          <NavLink to="/" className="nav-item active" style={{ display: 'inline-block' }}>
            Return to Home
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes — rendered outside the Layout shell */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected app routes — all require authentication */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="ask" element={<AssistantPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="salary-tax" element={<SalaryTaxPage />} />
          <Route path="salarytax" element={<Navigate to="/salary-tax" replace />} />
          <Route path="money-plan" element={<MoneyPlanPage />} />
          <Route path="moneyplan" element={<Navigate to="/money-plan" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
