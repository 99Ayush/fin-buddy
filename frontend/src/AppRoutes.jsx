/**
 * Fin-Buddy Frontend - Route Configuration (AppRoutes.jsx)
 * P1 registers ONLY /documents and /offers routes.
 * Other routes owned by P2, P3 - do not modify.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';

// Lazy-load P1 pages (code splitting)
const DocumentsPage = React.lazy(() => import('./module/documents/pages/DocumentsPage').catch(() => null));
const OffersPage = React.lazy(() => import('./module/offers/pages/OffersPage').catch(() => null));

// Placeholder pages for other modules (P2, P3)
const HomePage = React.lazy(() => import('./module/home/pages/HomePage').catch(() => null));
const SalaryTaxPage = React.lazy(() => import('./module/salarytax/pages/SalaryTaxPage').catch(() => null));
const MoneyPlanPage = React.lazy(() => import('./module/moneyplan/pages/MoneyPlanPage').catch(() => null));
const AssistantPage = React.lazy(() => import('./module/assistant/pages/AssistantPage').catch(() => null));

// Loading fallback
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
    <style jsx>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
  </div>
);

// Error fallback
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', padding: '24px' }}>
    <div style={{ textAlign: 'center', maxWidth: '400px' }}>
      <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Something went wrong</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error?.message || 'Failed to load page'}</p>
      <button
        onClick={resetErrorBoundary}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Try again
      </button>
    </div>
  </div>
);

// Simple Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        React.createElement(this.props.fallback, {
          error: this.state.error,
          resetErrorBoundary: this.resetErrorBoundary,
        })
      ) : (
        <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />
      );
    }
    return this.props.children;
  }
}

/**
 * Main App Routes Component
 * P1 ONLY modifies the /documents and /offers route registrations below.
 */
const AppRoutes = () => {
  return (
    <AppLayout>
      <Routes>
        {/* ============================================
             P1 ROUTES (ONLY THESE TWO LINES MODIFIED BY P1)
             ============================================ */}
        <Route
          path="/documents"
          element={
            <ErrorBoundary fallback={ErrorFallback}>
              <React.Suspense fallback={<LoadingFallback />}>
                <DocumentsPage />
              </React.Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/offers"
          element={
            <ErrorBoundary fallback={ErrorFallback}>
              <React.Suspense fallback={<LoadingFallback />}>
                <OffersPage />
              </React.Suspense>
            </ErrorBoundary>
          }
        />

        {/* ============================================
             P2 ROUTES (DO NOT MODIFY)
             ============================================ */}
        <Route
          path="/salarytax"
          element={
            <ErrorBoundary fallback={ErrorFallback}>
              <React.Suspense fallback={<LoadingFallback />}>
                <SalaryTaxPage />
              </React.Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/moneyplan"
          element={
            <ErrorBoundary fallback={ErrorFallback}>
              <React.Suspense fallback={<LoadingFallback />}>
                <MoneyPlanPage />
              </React.Suspense>
            </ErrorBoundary>
          }
        />

        {/* ============================================
             P3 ROUTES (DO NOT MODIFY)
             ============================================ */}
        <Route
          path="/home"
          element={
            <ErrorBoundary fallback={ErrorFallback}>
              <React.Suspense fallback={<LoadingFallback />}>
                <HomePage />
              </React.Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/assistant"
          element={
            <ErrorBoundary fallback={ErrorFallback}>
              <React.Suspense fallback={<LoadingFallback />}>
                <AssistantPage />
              </React.Suspense>
            </ErrorBoundary>
          }
        />

        {/* Default redirect to P1 landing */}
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/home" element={<Navigate to="/documents" replace />} />
        <Route path="*" element={<Navigate to="/documents" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default AppRoutes;