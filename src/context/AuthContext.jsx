import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Set global axios defaults
const apiUrl = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = `${apiUrl}/api`;
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && user._id) {
      const newSocket = io(import.meta.env.VITE_API_URL, {
        withCredentials: true,
        query: { userId: user._id, role: user.role }
      });
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [user]);

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
    const fetchUser = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser); // Set immediately for fast UI
          
          // Then fetch fresh data in background
          if (parsedUser && parsedUser._id) {
            const { data } = await axios.get('/auth/profile', {
              headers: { 'x-user-id': parsedUser._id }
            });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
          }
        } catch (error) {
          console.error("Error fetching fresh profile:", error);
        }
      }
      setLoading(false);
    };
    fetchUser();
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, socket }}>
      {children}
    </AuthContext.Provider>
  );
};
