import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

/**
 * Provides { user, loading, login, register, logout } to the entire app.
 * On mount, silently calls GET /api/auth/me to restore session from cookie.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // Restore session on page load / refresh
  useEffect(() => {
    api.get('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))   // no session — stay logged out
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { user } = await api.post('/auth/login', { email, password });
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const { user } = await api.post('/auth/register', { name, email, password });
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {}); // best-effort
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — must be used inside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
