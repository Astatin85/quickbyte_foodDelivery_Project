import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('qb_user')) || null; }
    catch { return null; }
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('qb_token'));

  const login = useCallback(async (auth_id, password) => {
    const res = await api.post('/auth/login', { auth_id, password });
    const { token, role, auth_id: id, profile } = res.data;
    sessionStorage.setItem('qb_token', token);
    sessionStorage.setItem('qb_user', JSON.stringify({ auth_id: id, role, profile }));
    setToken(token);
    setUser({ auth_id: id, role, profile });
    return { role, profile };
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, role, auth_id } = res.data;
    sessionStorage.setItem('qb_token', token);
    sessionStorage.setItem('qb_user', JSON.stringify({ auth_id, role }));
    setToken(token);
    setUser({ auth_id, role });
    return { role };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('qb_token');
    sessionStorage.removeItem('qb_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
