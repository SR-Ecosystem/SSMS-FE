import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, FileText, CheckCircle,
  LogOut, Menu, X, User as UserIcon, Sun, Moon, Clock, Gamepad2, MessageCircle, Bell, Code, Trophy, Calendar, Monitor,
  Briefcase, ChevronDown, ChevronRight, Palette
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
      Overview: true,
      Academic: true,
      Management: true,
      Operations: true,
      Account: true,
      Main: true,
      Learning: true,
      Performance: true,
      'Batches & Chat': true
    };
  });

  const toggleSection = (label) => {
    setExpandedSections(prev => {
      const updated = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem('expandedSections', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
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
    }
  ];

  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('theme-color') || 'Emerald';
  });

  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);

  const applyThemeColor = (themeName) => {
    const selected = themes.find(t => t.name === themeName) || themes[0];
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
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/3 rounded-full blur-[60px] animate-float-fast"></div>

        {/* Small floating dots */}
        <div className="absolute w-3 h-3 bg-emerald-500/25 dark:bg-emerald-400/20 rounded-full animate-bubble-1 top-[15%] left-[10%] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
        <div className="absolute w-2 h-2 bg-theme-primary/35 dark:bg-theme-primary/30 rounded-full animate-bubble-2 top-[45%] left-[15%] shadow-[0_0_8px_var(--color-theme-primary)]"></div>
        <div className="absolute w-4 h-4 bg-theme-accent/25 dark:bg-theme-accent/20 rounded-full animate-bubble-3 top-[75%] left-[25%] shadow-[0_0_12px_var(--color-theme-accent)]"></div>
        <div className="absolute w-3 h-3 bg-emerald-500/30 dark:bg-emerald-400/20 rounded-full animate-bubble-4 top-[25%] right-[15%] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
        <div className="absolute w-2.5 h-2.5 bg-theme-primary/30 dark:bg-theme-primary/25 rounded-full animate-bubble-5 top-[65%] right-[20%] shadow-[0_0_10px_var(--color-theme-primary)]"></div>
        <div className="absolute w-3.5 h-3.5 bg-emerald-400/25 dark:bg-emerald-400/15 rounded-full animate-bubble-6 top-[35%] right-[35%] shadow-[0_0_10px_rgba(52,211,153,0.3)]"></div>
        <div className="absolute w-2 h-2 bg-theme-accent/35 dark:bg-theme-accent/30 rounded-full animate-bubble-7 top-[85%] right-[40%] shadow-[0_0_8px_var(--color-theme-accent)]"></div>
        <div className="absolute w-3 h-3 bg-emerald-500/20 dark:bg-emerald-400/20 rounded-full animate-bubble-8 top-[55%] left-[45%] shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
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
              <div key={section.label} className="mb-2">
                {sIdx > 0 && (
                  <div className="mx-3 my-2 border-t border-slate-100 dark:border-white/5"></div>
                )}
                
                {/* Collapsible Section Header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 hover:bg-slate-50/50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-all duration-200 select-none cursor-pointer group focus:outline-none"
                >
                  <span>{section.label}</span>
                  <div className="text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
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
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white leading-none">Theme Colors</h3>
                  </div>
                  <div className="p-2 space-y-1">
                    {themes.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => {
                          applyThemeColor(t.name);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors duration-150 cursor-pointer ${
                          themeColor === t.name
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm shrink-0"
                          style={{ backgroundColor: t.primary }}
                        />
                        <span>{t.name}</span>
                      </button>
                    ))}
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
