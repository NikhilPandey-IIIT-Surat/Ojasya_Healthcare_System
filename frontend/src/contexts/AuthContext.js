import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Normalize user object — ensure full_name always exists regardless of which
// field the server returned (old tokens may have 'name' instead of 'full_name')
const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    full_name: userData.full_name || userData.name || 'User',
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ojasya_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const stored = localStorage.getItem('ojasya_user');
      if (stored) {
        try {
          setUser(normalizeUser(JSON.parse(stored)));
        } catch {
          localStorage.removeItem('ojasya_user');
        }
      }
    }
    setLoading(false);
  }, [token]);

  const login = (userData, jwt) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    setToken(jwt);
    localStorage.setItem('ojasya_token', jwt);
    localStorage.setItem('ojasya_user', JSON.stringify(normalized));
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ojasya_token');
    localStorage.removeItem('ojasya_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
