import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { AuthContext, type User } from './auth-context-core';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Guard against React 18 Strict Mode double-invoke: the effect runs twice in
  // development (mount → unmount → remount) which would fire two /auth/me calls.
  const didFetch = useRef(false);

  const fetchMe = async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const token = localStorage.getItem('token');
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password: pass });
      localStorage.setItem('token', data.accessToken);
      setUser(data.user);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.isNetworkError) {
        throw new Error(error.message);
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
