import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, FileText, CheckCircle,
  LogOut, Menu, X, User as UserIcon, Sun, Moon, Clock, Gamepad2, MessageCircle, Bell, Code, Trophy, Calendar, Monitor,
  Briefcase, ChevronDown, ChevronRight, Palette, Network
} from 'lucide-react';
import { io } from 'socket.io-client';
import Swal from 'sweetalert2';
import { soundManager } from '../utils/soundManager';
import Loader from './Loader';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Collapsible sidebar sections state
  const [expandedSections, setExpandedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('expandedSections');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Overview: false,
      Academic: false,
      Management: false,
      Operations: false,
      Account: false,
      Main: false,
      Learning: false,
      Performance: false,
      'Batches & Chat': false
    };
  });

  // Pinned sections state (clicked sections that stay open and styled dark)
  const [pinnedSections, setPinnedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('pinnedSections');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      Overview: false,
      Academic: false,
      Management: false,
      Operations: false,
      Account: false,
      Main: false,
      Learning: false,
      Performance: false,
      'Batches & Chat': false
    };
  });

  const toggleSection = (label) => {
    setPinnedSections(prev => {
      const isPinned = !prev[label];
      const updatedPinned = { ...prev, [label]: isPinned };
      try {
        localStorage.setItem('pinnedSections', JSON.stringify(updatedPinned));
      } catch (e) {}
      
      // Sync expanded state with pin state
      setExpandedSections(prevExpanded => {
        const updatedExpanded = { ...prevExpanded, [label]: isPinned };
        try {
          localStorage.setItem('expandedSections', JSON.stringify(updatedExpanded));
        } catch (e) {}
        return updatedExpanded;
      });

      return updatedPinned;
    });
  };

  const openSection = (label) => {
    setExpandedSections(prev => {
      if (prev[label]) return prev;
      const updated = { ...prev, [label]: true };
      try {
        localStorage.setItem('expandedSections', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const closeSection = (label) => {
    if (pinnedSections[label]) return; // If pinned, do not collapse on mouse leave
    setExpandedSections(prev => {
      if (!prev[label]) return prev;
      const updated = { ...prev, [label]: false };
      try {
        localStorage.setItem('expandedSections', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // --- HSL Shade Generator for Custom Colors ---
  const hexToHSL = (hex) => {
    let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0, s = 0, l = (max+min)/2;
    if (d !== 0) { s = l > 0.5 ? d/(2-max-min) : d/(max-min); h = max===r ? ((g-b)/d+(g<b?6:0))*60 : max===g ? ((b-r)/d+2)*60 : ((r-g)/d+4)*60; }
    return { h: Math.round(h), s: Math.round(s*100), l: Math.round(l*100) };
  };
  const hslToHex = (h,s,l) => {
    s/=100; l/=100;
    const a = s*Math.min(l,1-l);
    const f = n => { const k=(n+h/30)%12; return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1))); };
    return '#'+[f(0),f(8),f(4)].map(x=>x.toString(16).padStart(2,'0')).join('');
  };
  const generateThemeFromHex = (hex) => {
    const { h, s } = hexToHSL(hex);
    const shades = {
      50: hslToHex(h, Math.min(s,30), 97), 100: hslToHex(h, Math.min(s,40), 94),
      200: hslToHex(h, Math.min(s,50), 86), 300: hslToHex(h, Math.min(s,55), 74),
      400: hslToHex(h, s, 60), 500: hex,
      600: hslToHex(h, s, 42), 700: hslToHex(h, s, 34),
      800: hslToHex(h, s, 26), 900: hslToHex(h, s, 20)
    };
    const accent = hslToHex((h+20)%360, s, 50);
    return {
      name: 'Custom', primary: hex, accent,
      shades,
      bgLight: { start: shades[100], middle: shades[50], end: '#ffffff' },
      bgDark: { start: hslToHex(h, Math.min(s,50), 6), middle: hslToHex(h, Math.min(s,40), 3), end: '#010101' }
    };
  };

  const themes = [
    {
      name: 'Emerald',
      primary: '#10b981',
      accent: '#14b8a6',
      shades: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
      bgLight: { start: '#dcfce7', middle: '#f0fdf4', end: '#ffffff' },
      bgDark: { start: '#052217', middle: '#02120c', end: '#010604' }
    },
    {
      name: 'Amethyst',
      primary: '#8b5cf6',
      accent: '#6366f1',
      shades: { 50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
      bgLight: { start: '#ede9fe', middle: '#f5f3ff', end: '#ffffff' },
      bgDark: { start: '#120d2b', middle: '#070512', end: '#020106' }
    },
    {
      name: 'Crimson',
      primary: '#f97316',
      accent: '#ef4444',
      shades: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
      bgLight: { start: '#ffedd5', middle: '#fff7ed', end: '#ffffff' },
      bgDark: { start: '#220b02', middle: '#0e0400', end: '#040100' }
    },
    {
      name: 'Ocean',
      primary: '#0ea5e9',
      accent: '#3b82f6',
      shades: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' },
      bgLight: { start: '#e0f2fe', middle: '#f0f9ff', end: '#ffffff' },
      bgDark: { start: '#041727', middle: '#010911', end: '#000306' }
    },
    {
      name: 'Amber',
      primary: '#f59e0b',
      accent: '#eab308',
      shades: { 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
      bgLight: { start: '#fef3c7', middle: '#fffbeb', end: '#ffffff' },
      bgDark: { start: '#1d1102', middle: '#0b0600', end: '#030100' }
    },
    {
      name: 'Rose',
      primary: '#f43f5e',
      accent: '#d946ef',
      shades: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
      bgLight: { start: '#ffe4e6', middle: '#fff1f2', end: '#ffffff' },
      bgDark: { start: '#22040b', middle: '#0e0104', end: '#040001' }
    },
    {
      name: 'Midnight',
      primary: '#6366f1',
      accent: '#818cf8',
      shades: { 50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
      bgLight: { start: '#e0e7ff', middle: '#eef2ff', end: '#ffffff' },
      bgDark: { start: '#0c0a2a', middle: '#050419', end: '#010106' }
    },
    {
      name: 'Sakura',
      primary: '#ec4899',
      accent: '#f472b6',
      shades: { 50: '#fdf2f8', 100: '#fce7f3', 200: '#fbcfe8', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843' },
      bgLight: { start: '#fce7f3', middle: '#fdf2f8', end: '#ffffff' },
      bgDark: { start: '#200716', middle: '#0e030a', end: '#040002' }
    },
    {
      name: 'Mint',
      primary: '#2dd4bf',
      accent: '#5eead4',
      shades: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
      bgLight: { start: '#ccfbf1', middle: '#f0fdfa', end: '#ffffff' },
      bgDark: { start: '#041f1b', middle: '#020e0c', end: '#010504' }
    },
    {
      name: 'Slate',
      primary: '#64748b',
      accent: '#94a3b8',
      shades: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
      bgLight: { start: '#f1f5f9', middle: '#f8fafc', end: '#ffffff' },
      bgDark: { start: '#0a0f18', middle: '#05080e', end: '#020305' }
    },
    {
      name: 'Coral',
      primary: '#fb7185',
      accent: '#f97316',
      shades: { 50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337' },
      bgLight: { start: '#ffe4e6', middle: '#fff1f2', end: '#ffffff' },
      bgDark: { start: '#220812', middle: '#0e0308', end: '#040002' }
    },
    {
      name: 'Cyber',
      primary: '#22d3ee',
      accent: '#a78bfa',
      shades: { 50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63' },
      bgLight: { start: '#cffafe', middle: '#ecfeff', end: '#ffffff' },
      bgDark: { start: '#041c22', middle: '#020d11', end: '#010405' }
    }
  ];

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('theme-color') || 'Emerald';
  });
  const [customColor, setCustomColor] = useState(() => {
    return localStorage.getItem('custom-theme-color') || '#6366f1';
  });

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);

  const applyThemeColor = (themeName) => {
    let selected;
    if (themeName === 'Custom') {
      const savedCustom = localStorage.getItem('custom-theme-color') || customColor;
      selected = generateThemeFromHex(savedCustom);
    } else {
      selected = themes.find(t => t.name === themeName) || themes[0];
    }
    document.documentElement.style.setProperty('--color-theme-primary', selected.primary);
    document.documentElement.style.setProperty('--color-theme-accent', selected.accent);
    
    // Inject all 10 shades for the selected theme dynamically
    document.documentElement.style.setProperty('--color-primary-50', selected.shades[50]);
    document.documentElement.style.setProperty('--color-primary-100', selected.shades[100]);
    document.documentElement.style.setProperty('--color-primary-200', selected.shades[200]);
    document.documentElement.style.setProperty('--color-primary-300', selected.shades[300]);
    document.documentElement.style.setProperty('--color-primary-400', selected.shades[400]);
    document.documentElement.style.setProperty('--color-primary-500', selected.shades[500]);
    document.documentElement.style.setProperty('--color-primary-600', selected.shades[600]);
    document.documentElement.style.setProperty('--color-primary-700', selected.shades[700]);
    document.documentElement.style.setProperty('--color-primary-800', selected.shades[800]);
    document.documentElement.style.setProperty('--color-primary-900', selected.shades[900]);

    // Inject the gradient background variables dynamically
    document.documentElement.style.setProperty('--bg-gradient-start', selected.bgLight.start);
    document.documentElement.style.setProperty('--bg-gradient-middle', selected.bgLight.middle);
    document.documentElement.style.setProperty('--bg-gradient-end', selected.bgLight.end);
    document.documentElement.style.setProperty('--dark-bg-gradient-start', selected.bgDark.start);
    document.documentElement.style.setProperty('--dark-bg-gradient-middle', selected.bgDark.middle);
    document.documentElement.style.setProperty('--dark-bg-gradient-end', selected.bgDark.end);
    
    localStorage.setItem('theme-color', themeName);
    setThemeColor(themeName);
  };

  const handleCustomColorChange = (hex) => {
    setCustomColor(hex);
    localStorage.setItem('custom-theme-color', hex);
    localStorage.setItem('theme-color', 'Custom');
    setThemeColor('Custom');
    const custom = generateThemeFromHex(hex);
    document.documentElement.style.setProperty('--color-theme-primary', custom.primary);
    document.documentElement.style.setProperty('--color-theme-accent', custom.accent);
    Object.entries(custom.shades).forEach(([k,v]) => document.documentElement.style.setProperty(`--color-primary-${k}`, v));
    document.documentElement.style.setProperty('--bg-gradient-start', custom.bgLight.start);
    document.documentElement.style.setProperty('--bg-gradient-middle', custom.bgLight.middle);
    document.documentElement.style.setProperty('--bg-gradient-end', custom.bgLight.end);
    document.documentElement.style.setProperty('--dark-bg-gradient-start', custom.bgDark.start);
    document.documentElement.style.setProperty('--dark-bg-gradient-middle', custom.bgDark.middle);
    document.documentElement.style.setProperty('--dark-bg-gradient-end', custom.bgDark.end);
  };

  useEffect(() => {
    applyThemeColor(themeColor);
  }, [themeColor]);

  // Close theme menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme !== 'light'; // Default to dark
  });

  const [sessionActive, setSessionActive] = useState(() => {
    try {
      return localStorage.getItem('sessionActive') === 'true';
    } catch {
      return false;
    }
  });
  const [attendanceId, setAttendanceId] = useState(() => {
    try {
      return localStorage.getItem('attendanceId') || null;
    } catch {
      return null;
    }
  });
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(user?.role === 'student');
  const sessionSecondsRef = useRef(0);
  useEffect(() => { sessionSecondsRef.current = sessionSeconds; }, [sessionSeconds]);
  const attendanceIdRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sessionActive', sessionActive ? 'true' : 'false');
  }, [sessionActive]);

  useEffect(() => {
    if (attendanceId) {
      localStorage.setItem('attendanceId', attendanceId);
      attendanceIdRef.current = attendanceId;
    } else {
      localStorage.removeItem('attendanceId');
      attendanceIdRef.current = null;
    }
  }, [attendanceId]);

  // Notification count state
  const [pendingCount, setPendingCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [leavesCount, setLeavesCount] = useState(0);
  const [joinsCount, setJoinsCount] = useState(0);
  const [onlineStudentsCount, setOnlineStudentsCount] = useState(0);

  const [activeLeaveStatus, setActiveLeaveStatus] = useState({ isOnLeave: false, message: '' });

  // Header Notifications state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Persisted cleared notifications
  const [clearedNotifs, setClearedNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clearedNotifs')) || []; } catch { return []; }
  });

  // Track seen badge counts to hide red dots permanently until new updates arrive
  const [seenCounts, setSeenCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('seenBadgeCounts')) || {}; } catch { return {}; }
  });

  const notifLengthRef = useRef(0);
  useEffect(() => {
    notifLengthRef.current = notifications.length;
  }, [notifications.length]);

  // Clear badge when visiting the route
  useEffect(() => {
    const updateSeen = (key, count) => {
      if (count > 0 && seenCounts[key] !== count) {
        setSeenCounts(prev => {
          const next = { ...prev, [key]: count };
          localStorage.setItem('seenBadgeCounts', JSON.stringify(next));
          return next;
        });
      }
    };
    if (location.pathname.startsWith('/student/tasks')) updateSeen('tasks', pendingCount);
    if (location.pathname.startsWith('/student/chat')) updateSeen('chats', chatCount);
    if (location.pathname.startsWith('/reviews')) updateSeen('reviews', pendingCount);
    if (location.pathname.startsWith('/enrollments')) updateSeen('joins', joinsCount);
    if (location.pathname.startsWith('/leaves')) updateSeen('leaves', leavesCount);
  }, [location.pathname, pendingCount, chatCount, joinsCount, leavesCount, seenCounts]);

  // Global Click Sound Listener
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const isClickable = e.target.closest('button, a, select, input[type="submit"]');
      if (isClickable) {
        soundManager.init(); // Init context if needed
        soundManager.playClick();
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Initialize Dark Mode & Close Notifications on Outside Click
  useEffect(() => {
    // Apply saved theme or default to dark
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
      localStorage.setItem('theme', 'dark');
    }
  };

  // Student Attendance Tracking
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const checkingInRef = useRef(false);
  const timerIntervalRef = useRef(null);

  const startSession = async () => {
    if (checkingInRef.current || sessionActive) return;
    checkingInRef.current = true;
    setIsCheckingIn(true);
    try {
      const { data } = await axios.post('/attendance/checkin');
      setAttendanceId(data._id);
      attendanceIdRef.current = data._id;
      setSessionActive(true);
    } catch (error) {
      console.error('Checkin failed:', error);
      Swal.fire({
        title: 'Check-in Failed',
        text: error.response?.data?.message || 'Unable to check in at this time.',
        icon: 'error',
        confirmButtonText: 'Understood'
      });
    } finally {
      checkingInRef.current = false;
      setIsCheckingIn(false);
    }
  };

  useEffect(() => {
    if (sessionActive) {
      if (!timerIntervalRef.current) {
        let lastTick = Date.now();
        timerIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const delta = Math.floor((now - lastTick) / 1000);
          if (delta > 0) {
            setSessionSeconds(prev => prev + delta);
            lastTick = now;
          }
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [sessionActive]);

  // Fetch pending notifications count
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { data: onlineData } = await axios.get('/attendance/active-count');
        setOnlineStudentsCount(onlineData.activeCount || 0);

        if (user?.role === 'admin') {
          const { data } = await axios.get('/analytics/dashboard');
          setPendingCount(data.pendingReviews || 0);
          setLeavesCount(data.pendingLeavesCount || 0);
          setJoinsCount(data.joinRequestsCount || 0);

          const newNotifs = (data.notifications || []).filter(n => !clearedNotifs.includes(n.id));
          if (newNotifs.length > notifLengthRef.current && notifLengthRef.current > 0) {
            soundManager.playNotification();
          }
          setNotifications(newNotifs);
        } else if (user?.role === 'student') {
          const { data } = await axios.get(`/analytics/student/${user._id}`);
          setPendingCount(data.pendingTasks || 0);
          setChatCount(data.recentChats || 0);

          const newNotifs = (data.notifications || []).filter(n => !clearedNotifs.includes(n.id));
          if (newNotifs.length > notifLengthRef.current && notifLengthRef.current > 0) {
            soundManager.playNotification();
          }
          setNotifications(newNotifs);

          try {
            const { data: leaveData } = await axios.get('/leaves/active-status');
            setActiveLeaveStatus({ isOnLeave: leaveData.isOnLeave, message: leaveData.message });
          } catch (leaveErr) {
            console.error('Failed to fetch active leave status:', leaveErr);
          }

          // Restore today's attendance session state
          try {
            const summaryRes = await axios.get('/attendance/my-summary');
            const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const todayRecords = summaryRes.data.filter(r => {
              const rDate = r.date || (r.firstCheckIn ? new Date(r.firstCheckIn).toISOString().split('T')[0] : '');
              return rDate === todayStr;
            });

            if (todayRecords.length > 0) {
              const totalTodaySeconds = todayRecords.reduce((acc, curr) => acc + (curr.totalSeconds || 0), 0);
              const activeRecord = todayRecords.find(r => r.isActive);

              let additionalSeconds = 0;
              if (activeRecord && activeRecord.lastCheckInTime) {
                const now = Date.now();
                const lastCheckIn = new Date(activeRecord.lastCheckInTime).getTime();
                if (now > lastCheckIn) {
                  additionalSeconds = Math.floor((now - lastCheckIn) / 1000);
                }
              }

              setSessionSeconds(totalTodaySeconds + additionalSeconds);

              if (activeRecord) {
                setSessionActive(true);
                setAttendanceId(activeRecord._id);
                attendanceIdRef.current = activeRecord._id;
              } else {
                const wasActiveOnFrontend = localStorage.getItem('sessionActive') === 'true';
                if (wasActiveOnFrontend) {
                  console.log('Session was active on frontend but inactive on backend. Auto-resuming check-in...');
                  try {
                    const { data: checkinData } = await axios.post('/attendance/checkin');
                    setAttendanceId(checkinData._id);
                    attendanceIdRef.current = checkinData._id;
                    setSessionActive(true);
                  } catch (err) {
                    console.error('Auto-resume check-in failed:', err);
                    setSessionActive(false);
                    setAttendanceId(null);
                    attendanceIdRef.current = null;
                  }
                } else {
                  setSessionActive(false);
                  setAttendanceId(null);
                  attendanceIdRef.current = null;
                }
              }
            } else {
              setSessionActive(false);
              setAttendanceId(null);
              attendanceIdRef.current = null;
              setSessionSeconds(0);
            }
          } catch (attErr) {
            console.error('Failed to restore attendance session:', attErr);
          } finally {
            setIsSyncing(false);
          }
        }
      } catch (e) {
        console.error('Failed to fetch counts');
      }
    };
    if (user) {
      fetchCounts();
      const intervalId = setInterval(fetchCounts, 10000); // Poll every 10 seconds
      return () => clearInterval(intervalId);
    }
  }, [user, location.pathname]); // Re-fetch or clear if path changes



  const endSession = async (overrideSeconds) => {
    if (checkingInRef.current) return;
    if (user?.role === 'student' && attendanceIdRef.current) {
      checkingInRef.current = true;
      setIsCheckingIn(true);
      try {
        const finalSeconds = typeof overrideSeconds === 'number' ? overrideSeconds : sessionSecondsRef.current;
        await axios.post(`/attendance/checkout/${attendanceIdRef.current}`, {
          totalSeconds: finalSeconds
        });
        setSessionActive(false);
        setAttendanceId(null);
        attendanceIdRef.current = null;

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Fetch fresh aggregated total
        try {
          const summaryRes = await axios.get('/attendance/my-summary');
          const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          const todayRecords = summaryRes.data.filter(r => {
            const rDate = r.date || (r.firstCheckIn ? new Date(r.firstCheckIn).toISOString().split('T')[0] : '');
            return rDate === todayStr;
          });
          const totalTodaySeconds = todayRecords.reduce((acc, curr) => acc + (curr.totalSeconds || 0), 0);
          setSessionSeconds(totalTodaySeconds);
        } catch (e) { console.error('Failed to sync summary:', e); }
      } catch (e) {
        console.error('Checkout failed:', e);
      } finally {
        checkingInRef.current = false;
        setIsCheckingIn(false);
      }
    }
  };

  const handleLogout = async () => {
    if (sessionActive) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Check Out First',
        text: 'You must check out from your current attendance session before logging out.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    localStorage.removeItem('sessionActive');
    localStorage.removeItem('attendanceId');
    await logout();
    navigate('/login');
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const clearNotification = (id) => {
    const updatedCleared = [...clearedNotifs, id];
    setClearedNotifs(updatedCleared);
    localStorage.setItem('clearedNotifs', JSON.stringify(updatedCleared));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    const updatedCleared = [...clearedNotifs, ...allIds];
    setClearedNotifs(updatedCleared);
    localStorage.setItem('clearedNotifs', JSON.stringify(updatedCleared));
    setNotifications([]);
    setShowNotifications(false);
  };

  const getBadge = (key, count) => {
    // If current count is greater than the seen count, show the new total count
    return count > (seenCounts[key] || 0) ? count : 0;
  };

  const adminSections = [
    {
      label: 'Overview',
      links: [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      label: 'Academic',
      links: [
        { name: 'Task Management', path: '/tasks', icon: <FileText size={20} /> },
        { name: 'Review Submissions', path: '/reviews', icon: <CheckCircle size={20} />, badge: getBadge('reviews', pendingCount) },
        { name: 'LeetCode Challenges', path: '/leetcode', icon: <Code size={20} /> },
        { name: 'Mock Drives', path: '/mock-drives', icon: <Briefcase size={20} /> },
        { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy size={20} /> },
      ]
    },
    {
      label: 'Management',
      links: [
        { name: 'Manage Batches', path: '/batches', icon: <BookOpen size={20} /> },
        { name: 'Student Directory', path: '/students', icon: <Users size={20} /> },
        { name: 'Task Tracker', path: '/batch-tracker', icon: <BookOpen size={20} /> },
        { name: 'Join Requests', path: '/enrollments', icon: <UserIcon size={20} />, badge: getBadge('joins', joinsCount) },
      ]
    },
    {
      label: 'Operations',
      links: [
        { name: 'Attendance', path: '/attendance-logs', icon: <Clock size={20} /> },
        { name: 'Attendance Tracker', path: '/attendance-tracker', icon: <Clock size={20} /> },
        { name: 'Leave Requests', path: '/leaves', icon: <Calendar size={20} />, badge: getBadge('leaves', leavesCount) },
        { name: 'Batch Chat', path: '/chat', icon: <MessageCircle size={20} /> },
        { name: 'Traffic Control', path: '/traffic', icon: <Network size={20} /> },
      ]
    },
    {
      label: 'Account',
      links: [
        { name: 'Admin Profile', path: '/profile', icon: <UserIcon size={20} /> },
      ]
    }
  ];

  const studentSections = [
    {
      label: 'Main',
      links: [
        { name: 'Dashboard', path: '/student', icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      label: 'Learning',
      links: [
        { name: 'My Tasks', path: '/student/tasks', icon: <FileText size={20} />, badge: getBadge('tasks', pendingCount) },
        { name: 'LeetCode', path: '/student/leetcode', icon: <Code size={20} /> },
      ]
    },
    {
      label: 'Performance',
      links: [
        { name: 'My Grades', path: '/student/grades', icon: <CheckCircle size={20} /> },
        { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy size={20} /> },
        { name: 'Attendance Tracker', path: '/attendance-tracker', icon: <Clock size={20} /> },
      ]
    },
    {
      label: 'Batches & Chat',
      links: [
        { name: 'My Batches', path: '/student/my-batches', icon: <Users size={20} /> },
        { name: 'Available Batches', path: '/student/available-batches', icon: <BookOpen size={20} /> },
        { name: 'Batch Chat', path: '/student/chat', icon: <MessageCircle size={20} />, badge: getBadge('chats', chatCount) },
      ]
    },
    {
      label: 'Account',
      links: [
        { name: 'Login Activity', path: '/student/attendance', icon: <Clock size={20} /> },
        { name: 'Leave Application', path: '/student/leaves', icon: <Calendar size={20} /> },
        { name: 'My Profile', path: '/student/profile', icon: <UserIcon size={20} /> },
      ]
    }
  ];

  const sections = user?.role === 'admin' ? adminSections : studentSections;

  // Auto-expand section containing the active path on mount and navigation
  useEffect(() => {
    if (!sections) return;
    const activeSection = sections.find(section => 
      section.links.some(link => 
        location.pathname === link.path || 
        (link.path !== '/' && link.path !== '/student' && location.pathname.startsWith(link.path))
      )
    );
    if (activeSection) {
      setExpandedSections(prev => {
        if (prev[activeSection.label]) return prev;
        const updated = { ...prev, [activeSection.label]: true };
        try {
          localStorage.setItem('expandedSections', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      setPinnedSections(prev => {
        if (prev[activeSection.label]) return prev;
        const updated = { ...prev, [activeSection.label]: true };
        try {
          localStorage.setItem('pinnedSections', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  }, [location.pathname, sections]);

  if (user?.role === 'student' && isMobile) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
          <Monitor size={40} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Desktop Access Required</h1>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          The student portal is optimized for laptop and desktop browsers. Please log in from a computer to access your classes, tasks, and materials.
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-500 flex bg-transparent relative">
      {/* Background Animated Dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large blurry spots */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-theme-primary/5 dark:bg-theme-primary/3 rounded-full blur-[100px] animate-float-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-theme-accent/5 dark:bg-theme-accent/3 rounded-full blur-[80px] animate-float-medium"></div>
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-theme-primary/4 dark:bg-theme-primary/3 rounded-full blur-[60px] animate-float-fast"></div>

        {/* Floating Tech Logos */}
        {/* React */}
        <svg className="absolute w-10 h-10 opacity-[0.05] dark:opacity-[0.07] animate-bubble-1 top-[12%] left-[8%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)"><circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1" transform="rotate(120 12 12)"/></svg>
        {/* JavaScript */}
        <svg className="absolute w-8 h-8 opacity-[0.05] dark:opacity-[0.07] animate-bubble-2 top-[40%] left-[12%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)"><rect x="2" y="2" width="20" height="20" rx="2"/><text x="7" y="17" fontSize="10" fontWeight="bold" fill="white" fontFamily="sans-serif">JS</text></svg>
        {/* HTML5 */}
        <svg className="absolute w-12 h-12 opacity-[0.04] dark:opacity-[0.06] animate-bubble-3 top-[72%] left-[22%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)"><path d="M4 2l1.5 17L12 22l6.5-3L20 2H4zm13.1 5H8.7l.3 3h7.8l-.9 9.5L12 21l-3.9-1.5-.3-3h2.8l.2 1.7 1.2.4 1.2-.4.1-2.7H8l-.6-7h9.3l.4-1.5z"/></svg>
        {/* CSS3 */}
        <svg className="absolute w-9 h-9 opacity-[0.05] dark:opacity-[0.07] animate-bubble-4 top-[20%] right-[12%]" viewBox="0 0 24 24" fill="var(--color-theme-accent)"><path d="M4 2l1.5 17L12 22l6.5-3L20 2H4zm12.7 5H9.1l.2 2h7.1l-.7 8-3.7 1.3-3.7-1.3-.2-2.8h2.4l.1 1.4 1.4.5 1.4-.5.2-2H8.5l-.6-7h8.5l-.2 1.4z"/></svg>
        {/* Node.js */}
        <svg className="absolute w-11 h-11 opacity-[0.04] dark:opacity-[0.06] animate-bubble-5 top-[60%] right-[18%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)"><path d="M12 1.5l9 5.25v10.5l-9 5.25-9-5.25V6.75l9-5.25zM12 8v8m-3.5-6l3.5 2 3.5-2" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.5" strokeLinejoin="round"/><text x="8.5" y="16" fontSize="5" fontWeight="bold" fill="var(--color-theme-primary)" fontFamily="sans-serif">N</text></svg>
        {/* Python */}
        <svg className="absolute w-10 h-10 opacity-[0.05] dark:opacity-[0.07] animate-bubble-6 top-[32%] right-[32%]" viewBox="0 0 24 24" fill="var(--color-theme-accent)"><path d="M12 2c-1.7 0-3 .4-3.9 1.1-.9.7-1.1 1.7-1.1 2.9v2h5v1H6.5c-1.6 0-3 1-3.4 2.8-.5 2.1-.5 3.4 0 5.5.4 1.6 1.3 2.7 2.9 2.7h2V15c0-1.8 1.5-3.3 3.3-3.3h5.2c1.5 0 2.7-1.3 2.7-2.8V6c0-1.4-1.2-2.5-2.7-2.9-.9-.3-1.9-.1-2.8-.1h-.7zm-2.8 1.8c.6 0 1 .5 1 1s-.4 1-1 1-1-.5-1-1 .4-1 1-1z"/></svg>
        {/* MongoDB */}
        <svg className="absolute w-8 h-8 opacity-[0.05] dark:opacity-[0.07] animate-bubble-7 top-[82%] right-[38%]" viewBox="0 0 24 24" fill="var(--color-theme-primary)"><path d="M13.7 3.5c-.7-1.3-1.3-1.8-1.5-2.5 0 0-.2.8-.9 1.8-1.4 2-5.3 5.3-5.3 9.7 0 3.3 2.7 6 6 6s6-2.7 6-6c0-4.2-3.2-7.1-4.3-9zm-1.2 14.4c-.1 0-.2-.1-.2-.2v-1.5c-1.7-.3-2.6-1.3-2.6-1.3l.4-.7s1 1 2.4 1c.9 0 1.5-.5 1.5-1.1 0-1.5-4-1.5-4-4.1 0-1.3 1-2.3 2.3-2.5V6.1c0-.1.1-.2.2-.2h.3c.1 0 .2.1.2.2v1.3c1 .2 1.8.8 1.8.8l-.4.7s-.8-.7-1.9-.7c-1.1 0-1.5.6-1.5 1.1 0 1.5 4 1.3 4 4.1 0 1.3-1 2.4-2.3 2.7v1.6c0 .1-.1.2-.2.2h-.3z"/></svg>
        {/* Git */}
        <svg className="absolute w-9 h-9 opacity-[0.04] dark:opacity-[0.06] animate-bubble-8 top-[50%] left-[42%]" viewBox="0 0 24 24" fill="var(--color-theme-accent)"><path d="M23.5 11.3L12.7.5c-.7-.7-1.7-.7-2.4 0L8 2.8l3 3c.7-.2 1.5 0 2 .6.6.6.8 1.4.5 2.1l2.9 2.9c.7-.3 1.5-.1 2.1.5.8.8.8 2 0 2.8s-2 .8-2.8 0c-.6-.6-.8-1.6-.4-2.3l-2.7-2.7v7.1c.2.1.4.2.5.4.8.8.8 2 0 2.8s-2 .8-2.8 0-.8-2 0-2.8c.2-.2.5-.4.7-.5V9.2c-.2-.1-.5-.3-.7-.5-.6-.6-.8-1.5-.5-2.3L6.6 3.5.5 9.6c-.7.7-.7 1.7 0 2.4l10.8 10.8c.7.7 1.7.7 2.4 0l10.8-10.8c-.3-.3.3-1.4-.4-2.1-.3-.3-.3-.7-.6-.6z"/></svg>
        {/* Terminal */}
        <svg className="absolute w-10 h-10 opacity-[0.04] dark:opacity-[0.06] animate-bubble-1 top-[88%] left-[55%]" style={{animationDelay: '3s'}} viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        {/* Database */}
        <svg className="absolute w-8 h-8 opacity-[0.05] dark:opacity-[0.07] animate-bubble-3 top-[5%] left-[55%]" style={{animationDelay: '5s'}} viewBox="0 0 24 24" fill="none" stroke="var(--color-theme-accent)" strokeWidth="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
      </div>
      {isSyncing && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
          <Loader text="Syncing Attendance..." />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ fontFamily: "'ALEXANDER', 'Alexandria', sans-serif" }}
        className={`fixed inset-y-4 left-4 z-50 w-64 glass-panel overflow-hidden transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="h-24 flex items-center px-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-black/10">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-theme-primary/20 blur-xl rounded-full scale-150 group-hover:bg-theme-primary/30 transition-all duration-500"></div>
              <div className="relative w-14 h-14 rounded-xl bg-white shadow-[0_8px_15px_-3px_rgba(0,0,0,0.5)] border-t border-white/80 border-b-[4px] border-slate-300 dark:border-b-slate-900/80 dark:border-x-black/20 p-0.1 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:translate-y-0.5 group-active:border-b-[1px] overflow-hidden">
                <img src="/logo.png" alt="SSMS Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
            </div>
            <div className="flex flex-col relative z-10">
              <span className="font-extrabold text-[22px] leading-none tracking-tight bg-gradient-to-b from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 text-transparent bg-clip-text drop-shadow-md mb-1 transition-all group-hover:drop-shadow-lg">SSMS</span>
              <span className="text-[9px] font-black tracking-widest text-theme-primary uppercase leading-[1.1] drop-shadow-sm">Saran Students <br /> Management</span>
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar pr-2">
          {sections.map((section, sIdx) => {
            const isExpanded = expandedSections[section.label];
            return (
              <div
                key={section.label}
                className="mb-2"
                onMouseLeave={() => closeSection(section.label)}
              >
                {sIdx > 0 && (
                  <div className="mx-3 my-2 border-t border-slate-100 dark:border-white/5"></div>
                )}
                
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  onMouseEnter={() => openSection(section.label)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 select-none cursor-pointer group focus:outline-none border-l-[3px] ${
                    pinnedSections[section.label]
                      ? 'bg-slate-800 dark:bg-slate-950 text-white dark:text-slate-100 border-theme-primary shadow-md'
                      : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50/50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                  }`}
                >
                  <span>{section.label}</span>
                  <div className={`transition-colors ${
                    pinnedSections[section.label]
                      ? 'text-white dark:text-theme-primary'
                      : 'text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                  }`}>
                    {isExpanded ? (
                      <ChevronDown size={12} className="transform rotate-0 transition-transform duration-250" />
                    ) : (
                      <ChevronRight size={12} className="transform rotate-0 transition-transform duration-250" />
                    )}
                  </div>
                </button>

                {/* Section Links */}
                {isExpanded && (
                  <div className="space-y-1 mt-1 transition-all duration-300 animate-in fade-in slide-in-from-top-1 duration-200">
                    {section.links.map((link) => {
                      const isActive = location.pathname === link.path || (link.path !== '/' && link.path !== '/student' && location.pathname.startsWith(link.path));
                      return (
                        <Link
                          key={link.name}
                          to={link.path}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-[13px] border-l-4 ${
                            isActive
                              ? 'bg-gradient-to-r from-theme-primary/10 to-theme-accent/5 text-theme-primary font-bold border-theme-primary shadow-[0_2px_10px_-3px_var(--color-theme-primary)]'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/40 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 font-medium border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`transition-transform duration-250 ${isActive ? 'text-theme-primary scale-105' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`}>
                              {link.icon}
                            </span>
                            <span>{link.name}</span>
                          </div>
                          {link.badge > 0 && !isActive && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 text-[13px] font-bold"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-[280px] z-10 relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 lg:px-8 mt-4 mx-4 lg:mx-8 z-30 transition-colors duration-300">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 p-2 glass-panel"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-4 glass-panel px-2 py-1.5 h-14">

             {/* Online Students Count */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 dark:border-slate-700">
              <div className="w-2 h-2 rounded-full bg-theme-primary animate-pulse"></div>
              <span>{onlineStudentsCount} Online</span>
            </div>

            {/* Student Timer */}
            {user?.role === 'student' && sessionActive && (
              <div className="hidden sm:flex items-center gap-2 bg-theme-primary/10 text-theme-primary px-3 py-1.5 rounded-full text-sm font-medium border border-theme-primary/20">
                <Clock size={16} className="animate-pulse" />
                <span>{formatTime(sessionSeconds)}</span>
              </div>
            )}

            {/* Notifications Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center shadow-md animate-in zoom-in">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white leading-none">Notifications</h3>
                      <span className="text-[10px] text-slate-500 font-medium">{notifications.length} Unread</span>
                    </div>
                    {notifications.length > 0 && (
                      <button onClick={clearAllNotifications} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors relative group">
                          <button
                            onClick={() => clearNotification(notif.id)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Mark as read"
                          >
                            <X size={14} />
                          </button>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5 pr-6">{notif.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 pr-4">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(notif.time).toLocaleString()}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <CheckCircle size={24} className="text-emerald-500 mb-2 opacity-50" />
                        <p className="text-sm font-medium">All caught up!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Selector Toggle */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Select theme color"
              >
                <Palette size={18} />
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-[280px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-none">Theme Colors</h3>
                    <span className="text-[10px] text-slate-400 font-medium">{themes.length + 1} themes</span>
                  </div>
                  <div className="p-3 grid grid-cols-4 gap-2">
                    {themes.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => {
                          applyThemeColor(t.name);
                          setShowThemeMenu(false);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150 cursor-pointer group ${
                          themeColor === t.name
                            ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-offset-1 dark:ring-offset-slate-800'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                        style={themeColor === t.name ? { ringColor: t.primary } : {}}
                        title={t.name}
                      >
                        <div className="relative">
                          <span
                            className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-600 shadow-md block group-hover:scale-110 transition-transform"
                            style={{ backgroundColor: t.primary, boxShadow: `0 2px 8px ${t.primary}40` }}
                          />
                          {themeColor === t.name && (
                            <svg className="absolute inset-0 w-7 h-7 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </div>
                        <span className={`text-[9px] font-semibold leading-none truncate w-full text-center ${
                          themeColor === t.name ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>{t.name}</span>
                      </button>
                    ))}
                  </div>
                  {/* Custom Color Picker */}
                  <div className="border-t border-slate-100 dark:border-slate-700 p-3">
                    <div className="flex items-center gap-3">
                      <label
                        className="relative cursor-pointer group"
                        title="Pick a custom color"
                      >
                        <span
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-600 shadow-md block group-hover:scale-110 transition-transform"
                          style={{ background: `conic-gradient(#f43f5e, #f59e0b, #10b981, #0ea5e9, #8b5cf6, #ec4899, #f43f5e)` }}
                        />
                        {themeColor === 'Custom' && (
                          <svg className="absolute inset-0 w-7 h-7 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </label>
                      <div className="flex-1">
                        <p className={`text-[11px] font-bold leading-none ${
                          themeColor === 'Custom' ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}>Custom Color</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Pick any color you like</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-700 px-1.5 py-0.5 rounded">{themeColor === 'Custom' ? customColor : '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="hidden md:block text-right border-l border-slate-200 dark:border-white/10 pl-4 pr-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500 capitalize">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-theme-primary to-theme-accent text-white flex items-center justify-center shadow-md mr-1 overflow-hidden">
              <UserIcon size={18} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 pt-4 z-10 relative">
          <Outlet context={{ 
            sessionActive, startSession, endSession, sessionSeconds, formatTime, isCheckingIn, activeLeaveStatus,
            themeColor, activeTheme: themes.find(t => t.name === themeColor) || themes[0]
          }} />
        </div>
      </main>
    </div>
  );
};

export default Layout;
