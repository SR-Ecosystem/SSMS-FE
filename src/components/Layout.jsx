import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, BookOpen, FileText, CheckCircle, 
  LogOut, Menu, X, User as UserIcon, Sun, Moon, Clock, Gamepad2, MessageCircle, Bell, Code, Trophy, Calendar
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
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme !== 'light'; // Default to dark
  });
  
  const [sessionActive, setSessionActive] = useState(false);
  const [attendanceId, setAttendanceId] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isSyncing, setIsSyncing] = useState(user?.role === 'student');
  const sessionSecondsRef = useRef(0);
  useEffect(() => { sessionSecondsRef.current = sessionSeconds; }, [sessionSeconds]);
  const attendanceIdRef = useRef(null);

  // Notification count state
  const [pendingCount, setPendingCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [leavesCount, setLeavesCount] = useState(0);
  const [joinsCount, setJoinsCount] = useState(0);
  
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
    if (location.pathname.startsWith('/student/join-quiz')) updateSeen('quizzes', quizCount);
    if (location.pathname.startsWith('/student/chat')) updateSeen('chats', chatCount);
    if (location.pathname.startsWith('/reviews')) updateSeen('reviews', pendingCount);
    if (location.pathname.startsWith('/enrollments')) updateSeen('joins', joinsCount);
    if (location.pathname.startsWith('/leaves')) updateSeen('leaves', leavesCount);
  }, [location.pathname, pendingCount, quizCount, chatCount, joinsCount, leavesCount, seenCounts]);

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
          setQuizCount(data.activeQuizzes || 0);
          setChatCount(data.recentChats || 0);
          
          const newNotifs = (data.notifications || []).filter(n => !clearedNotifs.includes(n.id));
          if (newNotifs.length > notifLengthRef.current && notifLengthRef.current > 0) {
            soundManager.playNotification();
          }
          setNotifications(newNotifs);
          
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
                setSessionActive(false);
                setAttendanceId(null);
                attendanceIdRef.current = null;
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

  // Global Quiz Listener
  useEffect(() => {
    let socket = null;
    if (user?.role === 'student') {
      socket = io(import.meta.env.VITE_API_URL, { withCredentials: true });
      socket.on('connect', () => {
        socket.emit('student-listen-quizzes', { studentId: user._id });
      });
      // Removed the 'quiz-available' popup listener to prevent interrupting students.
    }
    return () => {
      if (socket) socket.close();
    };
  }, [user]);

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
        } catch(e) { console.error('Failed to sync summary:', e); }
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
        { name: 'Live Quizzes', path: '/quizzes', icon: <Gamepad2 size={20} /> },
      ]
    },
    {
      label: 'Management',
      links: [
        { name: 'Manage Batches', path: '/batches', icon: <BookOpen size={20} /> },
        { name: 'Student Directory', path: '/students', icon: <Users size={20} /> },
        { name: 'Batch Tracker', path: '/batch-tracker', icon: <BookOpen size={20} /> },
        { name: 'Join Requests', path: '/enrollments', icon: <UserIcon size={20} />, badge: getBadge('joins', joinsCount) },
      ]
    },
    {
      label: 'Operations',
      links: [
        { name: 'Attendance', path: '/attendance-logs', icon: <Clock size={20} /> },
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
        { name: 'My Quizzes', path: '/student/quizzes', icon: <Gamepad2 size={20} />, badge: getBadge('quizzes', quizCount) },
        { name: 'LeetCode', path: '/student/leetcode', icon: <Code size={20} /> },
      ]
    },
    {
      label: 'Performance',
      links: [
        { name: 'My Grades', path: '/student/grades', icon: <CheckCircle size={20} /> },
        { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy size={20} /> },
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

  return (
    <div className="min-h-screen transition-colors duration-500 flex bg-transparent">
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
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 group-hover:bg-emerald-500/30 transition-all duration-500"></div>
              <div className="relative w-12 h-12 rounded-xl bg-white shadow-[0_8px_15px_-3px_rgba(0,0,0,0.5)] border-t border-white/80 border-b-[4px] border-slate-300 dark:border-b-slate-900/80 dark:border-x-black/20 p-1 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-active:translate-y-0.5 group-active:border-b-[1px] overflow-hidden">
                <img src="/logo.png" alt="SSMS Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
            </div>
            <div className="flex flex-col relative z-10">
              <span className="font-extrabold text-[22px] leading-none tracking-tight bg-gradient-to-b from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 text-transparent bg-clip-text drop-shadow-md mb-1 transition-all group-hover:drop-shadow-lg">SSMS</span>
              <span className="text-[9px] font-black tracking-widest text-emerald-600 dark:text-emerald-400/90 uppercase leading-[1.1] drop-shadow-sm">Saran Students <br /> Management</span>
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
          {sections.map((section, sIdx) => (
            <div key={section.label}>
              {sIdx > 0 && (
                <div className="mx-3 my-2 border-t border-slate-100 dark:border-white/5"></div>
              )}
              <p className="px-4 pt-2 pb-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const isActive = location.pathname === link.path || (link.path !== '/' && link.path !== '/student' && location.pathname.startsWith(link.path));
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 text-[13px] ${
                        isActive 
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        {link.icon}
                        {link.name}
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
            </div>
          ))}
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
      <main className="flex-1 flex flex-col min-w-0 lg:ml-[280px]">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 lg:px-8 mt-4 mx-4 lg:mx-8 z-30 transition-colors duration-300">
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 p-2 glass-panel"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          
          <div className="ml-auto flex items-center gap-4 glass-panel px-2 py-1.5 h-14">
            
            {/* Student Timer */}
            {user?.role === 'student' && sessionActive && (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-800">
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md mr-1 overflow-hidden">
              <UserIcon size={18} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet context={{ sessionActive, startSession, endSession, sessionSeconds, formatTime, isCheckingIn }} />
        </div>
      </main>
    </div>
  );
};

export default Layout;
