import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';


export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">₹</div>
          <div>
            <p className="auth-brand-name">Financial Adviser Buddy</p>
            <p className="auth-brand-sub">Akumas · AI Financial Companion</p>
          </div>
        </div>

        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account to continue.</p>

        {error && (
          <div className="auth-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form id="login-form" className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="login-email">
            Email address
            <input
              id="login-email"
              name="email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-label" htmlFor="login-password">
            Password
            <div className="auth-input-wrap">
              <input
                id="login-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPwd(p => !p)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <button
            id="btn-login-submit"
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
