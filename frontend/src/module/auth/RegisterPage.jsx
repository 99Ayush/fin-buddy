import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthForm from './AuthForm';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault(); setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try { await register({ name: form.name, email: form.email, password: form.password }); navigate('/', { replace: true }); }
    catch (err) { setError(err.message || 'Registration failed. Please try again.'); }
    finally { setLoading(false); }
  };
  return <AuthForm title="Create your account" subtitle="Start your financial journey today." showName showConfirm onSubmit={handleSubmit} loading={loading} error={error} switchText="Already have an account?" switchLinkText="Sign in" switchLinkHref="/login" submitText="Create account" form={form} handleChange={handleChange} />;
}
