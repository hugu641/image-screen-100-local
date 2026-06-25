import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login state on startup
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
      } catch (err) {
        console.error('Failed to verify token on boot:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const register = async (email, password, name) => {
    const data = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await api.put('/auth/update-password', { currentPassword, newPassword });
  };

  const value = {
    user,
    loading,
    register,
    login,
    loginWithGoogle: async () => { throw new Error('Non disponible en mode local.'); },
    logout,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    role: user?.role || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
