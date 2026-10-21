import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

export default function AuthForm({
  title,
  subtitle,
  showName = false,
  showConfirm = false,
  onSubmit,
  loading = false,
  error,
  switchText,
  switchLinkText,
  switchLinkHref,
  submitText,
  form,
  handleChange,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const passwordInput = (id, name, label, shown, toggle) => (
    <label className="field" htmlFor={id}>
      {label}
      <span className="password-wrap">
        <input id={id} name={name} type={shown ? 'text' : 'password'} className="input" placeholder="••••••••" value={form[name]} onChange={handleChange} autoComplete={showConfirm ? 'new-password' : 'current-password'} required />
        <button type="button" className="visibility" onClick={toggle} aria-label={shown ? 'Hide password' : 'Show password'}>{shown ? 'Hide' : 'Show'}</button>
      </span>
    </label>
  );

  return (
    <AuthShell>
      <section className="form-container" aria-labelledby="auth-title">
        <div className="brand"><span>₹</span><div><strong>Fin-Buddy</strong><small>AI Financial Companion</small></div></div>
        <h1 id="auth-title" className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {error && <div className="error" role="alert">⚠️ {error}</div>}
        <form className="form" onSubmit={onSubmit} noValidate>
          {showName && <label className="field" htmlFor="register-name">Full name<input id="register-name" name="name" type="text" className="input" placeholder="Aman Verma" value={form.name} onChange={handleChange} autoComplete="name" required /></label>}
          <label className="field" htmlFor={showName ? 'register-email' : 'login-email'}>Email address<input id={showName ? 'register-email' : 'login-email'} name="email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" required /></label>
          {passwordInput(showName ? 'register-password' : 'login-password', 'password', <>Password {showName && <small>(min 8 characters)</small>}</>, showPassword, () => setShowPassword((value) => !value))}
          {showConfirm && passwordInput('register-confirm', 'confirm', 'Confirm password', showConfirmation, () => setShowConfirmation((value) => !value))}
          <button id={showName ? 'btn-register-submit' : 'btn-login-submit'} className="form-btn" type="submit" disabled={loading}>{loading ? 'Please wait…' : submitText}</button>
        </form>
        <p className="switch">{switchText} <Link to={switchLinkHref}>{switchLinkText}</Link></p>
      </section>
    </AuthShell>
  );
}

const AuthShell = styled.main`
  min-height: 100vh; display: grid; place-items: center; padding: 24px;
  background: linear-gradient(135deg, #eff6ff, #f8fafc 55%, #ecfdf5);
  .form-container { width: min(100%, 390px); background: #fff; box-shadow: rgba(15, 23, 42, .18) 0 12px 34px; border-radius: 16px; padding: 30px; box-sizing: border-box; }
  .brand { display: flex; gap: 10px; align-items: center; margin-bottom: 24px; color: #0f172a; }
  .brand > span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; color: #fff; background: teal; font-weight: 800; }
  .brand strong, .brand small { display: block; } .brand small { color: #64748b; font-size: 11px; margin-top: 1px; }
  .title { margin: 0; text-align: center; font-family: "Lucida Sans", sans-serif; font-size: 27px; font-weight: 800; color: #0f172a; }
  .subtitle { margin: 8px 0 22px; text-align: center; color: #64748b; font-size: 13px; }
  .form { display: flex; flex-direction: column; gap: 16px; } .field { color: #334155; font-size: 13px; font-weight: 700; }
  .field small { color: #64748b; font-weight: 500; } .input { width: 100%; margin-top: 6px; border-radius: 20px; border: 1px solid #c0c0c0; outline: none; box-sizing: border-box; padding: 12px 15px; font: inherit; }
  .input:focus { border-color: teal; box-shadow: 0 0 0 3px rgba(0, 128, 128, .12); } .password-wrap { position: relative; display: block; } .password-wrap .input { padding-right: 58px; }
  .visibility { position: absolute; right: 12px; top: 50%; transform: translateY(-25%); border: 0; background: transparent; color: teal; font-size: 11px; font-weight: 700; cursor: pointer; }
  .form-btn { padding: 11px 15px; border-radius: 20px; border: 0; background: teal; color: white; cursor: pointer; box-shadow: rgba(0,0,0,.18) 0 3px 8px; font: 700 14px "Lucida Sans", sans-serif; }
  .form-btn:disabled { opacity: .6; cursor: not-allowed; } .error { background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; border-radius: 8px; padding: 10px 12px; font-size: 13px; margin-bottom: 14px; }
  .switch { margin: 20px 0 0; color: #64748b; font: 12px "Lucida Sans", sans-serif; text-align: center; } .switch a { color: teal; font-weight: 800; text-decoration: underline; }
`;
