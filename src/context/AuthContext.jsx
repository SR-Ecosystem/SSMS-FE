import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Set global axios defaults
const apiUrl = import.meta.env.VITE_API_URL;
axios.defaults.baseURL = `${apiUrl}/api`;
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

let rrIndex = 0; // Round-robin index counter

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  
  // State for traffic manager
  const [trafficConfig, setTrafficConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('trafficConfig');
      const parsed = saved ? JSON.parse(saved) : { policy: 'failover', servers: [] };
      if (parsed && parsed.servers) {
        parsed.servers = parsed.servers.map(s => {
          if (s.isPrimary) {
            return { ...s, url: import.meta.env.VITE_API_URL };
          }
          return s;
        });
      }
      return parsed;
    } catch (e) {
      return { policy: 'failover', servers: [] };
    }
  });

  const trafficConfigRef = useRef(trafficConfig);
  useEffect(() => {
    trafficConfigRef.current = trafficConfig;
  }, [trafficConfig]);

  // Fetch public config (active servers list + policy)
  const refreshTrafficConfig = async () => {
    try {
      const defaultBase = import.meta.env.VITE_API_URL || '';
      const { data } = await axios.get(`${defaultBase}/api/traffic/public-config`);
      
      // Force the primary server URL to match the environment variable VITE_API_URL
      if (data && data.servers) {
        data.servers = data.servers.map(s => {
          if (s.isPrimary) {
            return { ...s, url: import.meta.env.VITE_API_URL };
          }
          return s;
        });
      }
      
      setTrafficConfig(data);
      localStorage.setItem('trafficConfig', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to fetch public traffic config, using local cache:', err);
    }
  };

  useEffect(() => {
    refreshTrafficConfig();
  }, []);

  // Set up socket connection based on current active backend server
  useEffect(() => {
    if (user && user._id) {
      const { servers, policy, manualSelectedServerId } = trafficConfig;
      const activeServers = servers && servers.length > 0 
        ? servers.filter(s => s.status !== 'offline') 
        : [];
      
      let socketUrl = import.meta.env.VITE_API_URL;
      
      if (activeServers.length > 0) {
        let chosenServer = activeServers[0];
        if (policy === 'manual') {
          const selected = servers.find(s => s.id === manualSelectedServerId || s._id === manualSelectedServerId);
          if (selected && selected.status !== 'offline') {
            chosenServer = selected;
          }
        } else if (policy === 'latency') {
          const sorted = [...activeServers].sort((a, b) => a.responseTime - b.responseTime);
          chosenServer = sorted[0];
        }
        socketUrl = chosenServer.url;
      }

      console.log(`Connecting socket to: ${socketUrl}`);
      const newSocket = io(socketUrl, {
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
  }, [user, trafficConfig]);

  // Set up axios interceptors for header and dynamic load-balancing
  useEffect(() => {
    // 1. Request Interceptor
    const requestInterceptor = axios.interceptors.request.use((config) => {
      // Add custom header
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed._id) {
          config.headers['x-user-id'] = parsed._id;
        }
      }

      // Skip load balancing if URL is already absolute (e.g. pointing to external links, uploads, or a direct ping)
      if (config.url && (config.url.startsWith('http://') || config.url.startsWith('https://'))) {
        return config;
      }

      // Calculate the base URL based on traffic policy
      const currentConfig = trafficConfigRef.current;
      const { policy, servers, manualSelectedServerId } = currentConfig;
      const activeServers = servers && servers.length > 0 
        ? servers.filter(s => s.status !== 'offline') 
        : [];

      if (activeServers.length > 0) {
        let selectedUrl = `${import.meta.env.VITE_API_URL}/api`;

        switch (policy) {
          case 'manual': {
            const selected = servers.find(s => s.id === manualSelectedServerId || s._id === manualSelectedServerId);
            if (selected && selected.status !== 'offline') {
              selectedUrl = `${selected.url}/api`;
            } else {
              selectedUrl = `${activeServers[0].url}/api`;
            }
            break;
          }
          case 'latency': {
            const sorted = [...activeServers].sort((a, b) => a.responseTime - b.responseTime);
            selectedUrl = `${sorted[0].url}/api`;
            break;
          }
          case 'round-robin': {
            const selected = activeServers[rrIndex % activeServers.length];
            rrIndex = (rrIndex + 1) % activeServers.length;
            selectedUrl = `${selected.url}/api`;
            break;
          }
          case 'failover':
          default: {
            const primaryOnline = activeServers.find(s => s.isPrimary && s.status !== 'offline');
            if (primaryOnline) {
              selectedUrl = `${primaryOnline.url}/api`;
            } else {
              selectedUrl = `${activeServers[0].url}/api`;
            }
            break;
          }
        }
        config.baseURL = selectedUrl;
      }

      return config;
    });

    // 2. Response Interceptor for Automatic Failover & Retry
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If request failed due to server crash/network loss and hasn't been retried yet
        if (originalRequest && !originalRequest._retryCount) {
          originalRequest._retryCount = 1;
          
          const isNetworkOr5xxError = !error.response || (error.response.status >= 502 && error.response.status <= 504);
          
          if (isNetworkOr5xxError) {
            const currentConfig = trafficConfigRef.current;
            const currentBaseURL = originalRequest.baseURL;
            
            // Filter other healthy backup servers
            const backupServers = currentConfig.servers.filter(s => 
              s.status !== 'offline' && `${s.url}/api` !== currentBaseURL
            );
            
            if (backupServers.length > 0) {
              const fallbackServer = backupServers[0];
              originalRequest.baseURL = `${fallbackServer.url}/api`;
              console.warn(`Request failed on ${currentBaseURL}. Retrying on fallback: ${fallbackServer.name} (${fallbackServer.url})`);
              
              // Re-execute axios request with the new baseURL
              return axios(originalRequest);
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [trafficConfig]);

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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUser, 
      socket, 
      trafficConfig, 
      refreshTrafficConfig 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

