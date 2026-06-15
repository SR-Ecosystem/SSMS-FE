import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Set global axios defaults
axios.defaults.baseURL = 'https://ssms-be.onrender.com/api';
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for the custom header
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed._id) {
          config.headers['x-user-id'] = parsed._id;
        }
      }
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/auth/login', { email, password });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  };

  const register = async (name, email, password, role) => {
    const { data } = await axios.post('/auth/register', { name, email, password, role });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
