// Holds the signed-in user plus the sign-in / sign-out actions.
// The access token itself lives in apiClient (memory). This context tracks the
// user object and a `loading` flag while we try to restore a session on first load.

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../lib/apiClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, try to restore a session from the refresh cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (cancelled) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // No valid session - the visitor is a guest, which is fine.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear locally regardless of the server response.
    }
    setAccessToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      hasRole: (...roles) => !!user && roles.some((r) => user.roles.includes(r)),
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
