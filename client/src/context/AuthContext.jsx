import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('portfolio_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('portfolio_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const { data } = await authApi.getMe();
          setUser(data.user);
          localStorage.setItem('portfolio_user', JSON.stringify(data.user));
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('portfolio_token', data.token);
      localStorage.setItem('portfolio_user', JSON.stringify(data.user));
      return data;
    }
  };

  // Sign in with Google: pass the authorization code + SPA origin to the
  // server, which exchanges it for the profile and returns the same JWT shape
  // as the password login. Everything below is identical to `login`.
  const loginWithGoogle = async (code, redirectUri) => {
    const { data } = await authApi.googleLogin(code, redirectUri);
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('portfolio_token', data.token);
      localStorage.setItem('portfolio_user', JSON.stringify(data.user));
      return data;
    }
  };

  const logout = () => {
    // Fire the server-side revocation (bumps tokenVersion, killing the token)
    // but never block the local sign-out. If the call fails we still clear state.
    authApi.logout().catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('portfolio_token');
    localStorage.removeItem('portfolio_user');
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('portfolio_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, loginWithGoogle, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
