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
  
  // Collect environment-defined servers (VITE_API_URL1, VITE_API_URL2, VITE_API_URL3)
  const getEnvServers = () => {
    const envUrls = [
      import.meta.env.VITE_API_URL1,
      import.meta.env.VITE_API_URL2,
      import.meta.env.VITE_API_URL3,
      import.meta.env.VITE_API_URL
    ].filter(Boolean);
    
    const uniqueUrls = [...new Set(envUrls.map(url => url.trim().endsWith('/') ? url.trim().slice(0, -1) : url.trim()))];
    
    return uniqueUrls.map((url, idx) => {
      const isPrimary = idx === 0 || url === (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
      return {
        id: `env_${idx}`,
        name: isPrimary ? 'Primary Server' : `Backend Server ${idx + 1}`,
        url: url,
        isPrimary: isPrimary,
        status: 'unknown',
        responseTime: 0,
        isActive: true
      };
    });
  };

  // State for traffic manager
  const [trafficConfig, setTrafficConfig] = useState(() => {
    const envServers = getEnvServers();
    try {
      const saved = localStorage.getItem('trafficConfig');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed) {
        // Merge saved data with env servers
        const mergedServers = envServers.map(envS => {
          const match = parsed.servers?.find(s => s.url === envS.url);
          if (match) {
            return {
              ...envS,
              status: match.status,
              responseTime: match.responseTime,
              isActive: match.isActive !== undefined ? match.isActive : true
            };
          }
          return envS;
        });
        return {
          policy: parsed.policy || 'failover',
          manualSelectedServerId: parsed.manualSelectedServerId || null,
          servers: mergedServers
        };
      }
      return { policy: 'failover', manualSelectedServerId: null, servers: envServers };
    } catch (e) {
      return { policy: 'failover', manualSelectedServerId: null, servers: envServers };
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
      
      setTrafficConfig(prev => {
        const envServers = getEnvServers();
        const dbServers = data.servers || [];
        const merged = [...envServers];
        
        dbServers.forEach(dbS => {
          const cleanUrl = dbS.url.trim().endsWith('/') ? dbS.url.trim().slice(0, -1) : dbS.url.trim();
          const exists = merged.some(s => s.url === cleanUrl);
          if (!exists) {
            merged.push({
              id: dbS.id || dbS._id,
              name: dbS.name,
              url: cleanUrl,
              isPrimary: dbS.isPrimary,
              status: dbS.status || 'unknown',
              responseTime: dbS.responseTime || 0,
              isActive: true
            });
          }
        });
        
        // Retain statuses from previous state if URLs match
        const finalServers = merged.map(s => {
          const prevMatch = prev.servers?.find(ps => ps.url === s.url);
          if (prevMatch) {
            return {
              ...s,
              status: prevMatch.status !== 'unknown' ? prevMatch.status : s.status,
              responseTime: prevMatch.responseTime > 0 ? prevMatch.responseTime : s.responseTime
            };
          }
          return s;
        });

        const nextConfig = {
          policy: data.policy || prev.policy || 'failover',
          manualSelectedServerId: data.manualSelectedServerId || prev.manualSelectedServerId || null,
          servers: finalServers
        };
        
        localStorage.setItem('trafficConfig', JSON.stringify(nextConfig));
        return nextConfig;
      });
    } catch (err) {
      console.error('Failed to fetch public traffic config, using local cache:', err);
    }
  };

  // Background browser-based health check for environment nodes
  useEffect(() => {
    const pingServers = async () => {
      const { servers } = trafficConfigRef.current;
      if (!servers || servers.length <= 1) return;

      const updatedServers = await Promise.all(servers.map(async (server) => {
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout
          
          await fetch(`${server.url}/api/traffic/public-config`, {
            method: 'GET',
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-store'
          });
          clearTimeout(timeoutId);
          
          const latency = Date.now() - start;
          return { ...server, status: 'online', responseTime: latency };
        } catch (e) {
          return { ...server, status: 'offline', responseTime: 0 };
        }
      }));

      const changed = JSON.stringify(servers) !== JSON.stringify(updatedServers);
      if (changed) {
        setTrafficConfig(prev => {
          const nextConfig = { ...prev, servers: updatedServers };
          localStorage.setItem('trafficConfig', JSON.stringify(nextConfig));
          return nextConfig;
        });
      }
    };

    const delayId = setTimeout(pingServers, 2500);
    const intervalId = setInterval(pingServers, 60000);

    return () => {
      clearTimeout(delayId);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    refreshTrafficConfig();
  }, []);

  // Calculate active socket URL
  const getSocketUrl = () => {
    const { servers, policy, manualSelectedServerId } = trafficConfig;
    const activeServers = servers && servers.length > 0 
      ? servers.filter(s => s.status !== 'offline') 
      : [];
    
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
      return chosenServer.url;
    }
    return import.meta.env.VITE_API_URL;
  };

  const socketUrl = getSocketUrl();
  const userIdStr = user?._id || '';

  // Set up socket connection based on current active backend server
  useEffect(() => {
    if (userIdStr) {
      console.log(`Connecting socket to: ${socketUrl}`);
      const newSocket = io(socketUrl, {
        withCredentials: true,
        query: { userId: userIdStr, role: user.role },
        reconnectionDelay: 5000,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5
      });
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      setSocket(null);
    }
  }, [userIdStr, socketUrl]);

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

