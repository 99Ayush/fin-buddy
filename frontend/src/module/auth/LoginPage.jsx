import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthForm from './AuthForm';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await login(form); navigate('/', { replace: true }); }
    catch (err) { setError(err.message || 'Login failed. Please try again.'); }
    finally { setLoading(false); }
  };
  return <AuthForm title="Welcome back" subtitle="Sign in to your account to continue." onSubmit={handleSubmit} loading={loading} error={error} switchText="Don't have an account?" switchLinkText="Create one" switchLinkHref="/register" submitText="Sign in" form={form} handleChange={handleChange} />;
}
