import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Start your financial journey today.</p>

        {error && (
          <div className="auth-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form id="register-form" className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="register-name">
            Full name
            <input
              id="register-name"
              name="name"
              type="text"
              className="auth-input"
              placeholder="Aman Verma"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </label>

          <label className="auth-label" htmlFor="register-email">
            Email address
            <input
              id="register-email"
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

          <label className="auth-label" htmlFor="register-password">
            Password <span className="auth-hint">(min 8 characters)</span>
            <input
              id="register-password"
              name="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </label>

          <label className="auth-label" htmlFor="register-confirm">
            Confirm password
            <input
              id="register-confirm"
              name="confirm"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={form.confirm}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </label>

          <button
            id="btn-register-submit"
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
