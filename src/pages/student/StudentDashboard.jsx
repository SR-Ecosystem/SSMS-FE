import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { BookOpen, CheckCircle, Clock, Target, Play, Square, Bell, User as UserIcon, CreditCard, ChevronRight, TrendingUp, TrendingDown, Award, Trophy, Users, MessageCircle, FileText, Gamepad2, Code, Calendar, Loader2, ClipboardCheck, Briefcase } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import SkeletonLoader from '../../components/SkeletonLoader';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { 
    sessionActive, startSession, endSession, sessionSeconds, formatTime, isCheckingIn, activeLeaveStatus,
    themeColor, activeTheme
  } = useOutletContext();
  const [analytics, setAnalytics] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, leave: 0, inProgress: 0, invalid: 0, total: 0, percentage: 0 });
  const [checkInAccess, setCheckInAccess] = useState({ hasAccess: false, accessType: null });

  const [activeLeetcode, setActiveLeetcode] = useState([]);
  const [mockScores, setMockScores] = useState([]);
  const [leetcodeLinks, setLeetcodeLinks] = useState({});
  const [submittingLeetcode, setSubmittingLeetcode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, leetcodeRes, attendanceRes, accessRes, mockRes] = await Promise.all([
          axios.get(`/analytics/student/${user._id}`),
          axios.get('/leetcode/active'),
          axios.get('/attendance/my-summary'),
          axios.get('/checkin-access/my-status').catch(() => ({ data: { hasAccess: false } })),
          axios.get(`/mock-drives/student/${user._id}`).catch(() => ({ data: [] }))
        ]);
        setAnalytics(analyticsRes.data);
        setActiveLeetcode(leetcodeRes.data);
        setCheckInAccess(accessRes.data);
        setMockScores(mockRes.data || []);

        // Calculate attendance stats from logs
        const logs = attendanceRes.data || [];
        // Group by date to get unique days
        const dayMap = {};
        logs.forEach(log => {
          const key = log.date;
          if (!dayMap[key]) {
            dayMap[key] = { totalSeconds: 0, isLeave: false, isActive: false, leaveHours: 0, status: null };
          }
          dayMap[key].totalSeconds += (log.totalSeconds || 0);
          if (log.isLeave || log.status === 'Leave') dayMap[key].isLeave = true;
          if (log.isActive) dayMap[key].isActive = true;
          dayMap[key].leaveHours = Math.max(dayMap[key].leaveHours, log.leaveHours || 0);
        });

        let present = 0, absent = 0, leave = 0, inProgress = 0, invalid = 0;
        const todayDateStr = new Date().toISOString().split('T')[0];
        // Exclude today from percentage calculation (day still in progress)
        Object.entries(dayMap).forEach(([dateKey, day]) => {
          if (dateKey === todayDateStr) return; // skip today
          if (day.isLeave && (day.leaveHours || 0) === 0) { leave++; return; }
          const hours = day.totalSeconds / 3600;
          const minRequired = 8 - day.leaveHours;
          if (hours >= minRequired && hours <= 10) { present++; }
          else if (hours > 10) { invalid++; }
          else if (day.isActive) { inProgress++; }
          else { absent++; }
        });

        const totalDays = Object.keys(dayMap).length;
        const pastDays = totalDays - (dayMap[todayDateStr] ? 1 : 0);
        const denominator = pastDays - leave;
        const pct = denominator > 0 ? Math.round((present / denominator) * 100) : 0;
        setAttendanceStats({ present, absent, leave, inProgress, invalid, total: totalDays, percentage: pct });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  if (loading) return <SkeletonLoader type="student-dashboard" />;

  const completionData = [
    { name: 'Completed', value: analytics?.completedTasks || 0 },
    { name: 'Pending', value: analytics?.pendingTasks || 0 },
  ];
  const COLORS = ['#10b981', '#cbd5e1'];
  const DARK_COLORS = ['#34d399', '#334155'];

  const processedChartData = analytics?.chartData?.length === 1 
    ? [{ name: 'Start', score: 0 }, ...analytics.chartData] 
    : analytics?.chartData;

  const handleLeetcodeSubmit = async (problemId) => {
    const linkToSubmit = leetcodeLinks[problemId];
    if (!linkToSubmit) {
      Swal.fire('Error', 'Please enter your solution link', 'error');
      return;
    }
    setSubmittingLeetcode(true);
    try {
      await axios.post(`/leetcode/${problemId}/submit`, { solutionLink: linkToSubmit });
      Swal.fire('Success', 'LeetCode solution submitted! Streak updated. 🔥', 'success');
      // Update UI state
      setActiveLeetcode(prev => prev.map(p => p._id === problemId ? { ...p, isSubmitted: true } : p));
      setLeetcodeLinks(prev => ({ ...prev, [problemId]: '' }));
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Could not submit solution', 'error');
    } finally {
      setSubmittingLeetcode(false);
    }
  };

  const quickLinks = [
    { name: 'Available Batches', path: '/student/available-batches', icon: <BookOpen size={20} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { name: 'My Batches', path: '/student/my-batches', icon: <Users size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { name: 'Batch Chat', path: '/student/chat', icon: <MessageCircle size={20} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { name: 'My Tasks', path: '/student/tasks', icon: <FileText size={20} />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { name: 'LeetCode', path: '/student/leetcode', icon: <Code size={20} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: <Trophy size={20} />, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-500/10' },
    { name: 'My Grades', path: '/student/grades', icon: <CheckCircle size={20} />, color: 'text-theme-primary', bg: 'bg-primary-50 dark:bg-primary-500/10' },
    { name: 'Mock Drives', path: '/student/grades?tab=mockDrives', icon: <Briefcase size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { name: 'Apply Leave', path: '/student/leaves', icon: <Calendar size={20} />, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-500/10' },
    { name: 'Login Activity', path: '/student/attendance', icon: <Clock size={20} />, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
    { name: 'My Profile', path: '/student/profile', icon: <UserIcon size={20} />, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header section styling matching the Wallet App */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-400 to-theme-accent text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-theme-primary/30">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Hello, {user?.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Great, your learning is on track</p>
          </div>
        </div>
        
        {/* Streak Counter */}
        <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-2xl border border-orange-100 dark:border-orange-800/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
          </div>
          <div>
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">LeetCode Streak</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{user?.leetcodeStreak || 0} <span className="text-sm font-medium text-slate-500">Days</span></p>
          </div>
        </div>
      </div>

      {/* Row 1: Task Completion (3), ID Card (6), Leaderboard (3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* Top Left: Task Completion Donut */}
        <Link to="/student/tasks" className={`md:col-span-4 lg:col-span-3 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col items-center justify-center text-center hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer block relative overflow-hidden group text-white ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40 hover:shadow-[0_12px_20px_-6px_rgba(16,185,129,0.5)]'
            : 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-theme-primary/40 hover:shadow-[0_12px_20px_-6px_var(--color-theme-primary)]'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="mb-2 relative z-10">
            <h3 className="text-sm font-bold text-white mb-1 drop-shadow-sm">Task Completion</h3>
            <p className={`text-xs font-medium drop-shadow-sm ${themeColor === 'Emerald' ? 'text-emerald-50' : 'text-primary-50'}`}>Your progress overview</p>
          </div>
          
          <div className="flex flex-col items-center w-full gap-5 mt-2 relative z-10">
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={56}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ffffff' : 'rgba(255,255,255,0.25)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/80 font-semibold uppercase tracking-wider drop-shadow-sm">Done</span>
                <span className="text-xl font-bold text-white leading-none mt-1 drop-shadow-md">{analytics?.taskCompletionRate || 0}%</span>
              </div>
            </div>

            <div className="space-y-3 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm"></div>
                  <span className="text-white font-semibold drop-shadow-sm">Completed</span>
                </div>
                <span className="font-bold text-white drop-shadow-sm">{analytics?.completedTasks || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                  <span className="text-white font-semibold drop-shadow-sm">Pending</span>
                </div>
                <span className="font-bold text-white drop-shadow-sm">{analytics?.pendingTasks || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Center: The "Credit Card" Widget (ID Card / Timer) */}
        <div className={`md:col-span-8 lg:col-span-6 relative overflow-hidden rounded-3xl p-6 text-white border-t border-white/40 border-b-[3px] border-black/20 flex flex-col group ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/40'
            : 'bg-gradient-to-br from-primary-400 to-theme-accent shadow-lg shadow-theme-accent/40'
        }`}>
          {/* Card Decorations */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <Link to="/student/attendance" className="group flex flex-col hover:opacity-80 transition-opacity">
              <p className="text-emerald-50 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                Student ID Card <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-5px] group-hover:translate-x-0" />
              </p>
              <h3 className="font-bold text-lg leading-none flex items-center gap-2">
                SSMS Base
                {checkInAccess.hasAccess && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    checkInAccess.accessType === 'wfh' 
                      ? 'bg-sky-400 text-slate-950 border border-sky-300 animate-pulse' 
                      : 'bg-emerald-400 text-slate-950 border border-emerald-300'
                  }`}>
                    {checkInAccess.accessType === 'wfh' ? 'WFH' : 'On-Site'}
                  </span>
                )}
              </h3>
            </Link>
            <Link to="/student/profile" className="hover:opacity-80 transition-opacity" title="My Profile">
              <UserIcon size={24} className="opacity-80" />
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-y-4 gap-x-6 my-4">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${themeColor === 'Emerald' ? 'text-emerald-100/80' : 'text-primary-100/80'}`}>Student Name</p>
              <p className="font-bold text-lg leading-tight">{user?.name || 'NOT SET'}</p>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${themeColor === 'Emerald' ? 'text-emerald-100/80' : 'text-primary-100/80'}`}>Roll Number</p>
              <p className="font-mono font-bold text-lg tracking-wider leading-tight">{user?.rollNumber || 'NOT SET'}</p>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${themeColor === 'Emerald' ? 'text-emerald-100/80' : 'text-primary-100/80'}`}>Email Address</p>
              <p className="font-medium text-sm truncate opacity-90">{user?.email || 'NOT SET'}</p>
            </div>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${themeColor === 'Emerald' ? 'text-emerald-100/80' : 'text-primary-100/80'}`}>Phone Number</p>
              <p className="font-mono font-medium text-sm opacity-90">{user?.phone || 'NOT SET'}</p>
            </div>
          </div>

          <div className={`relative z-10 flex items-center justify-between mt-auto pt-4 border-t ${
            themeColor === 'Emerald' ? 'border-emerald-400/30' : 'border-primary-400/30'
          }`}>
            <div>
              <p className={`text-xs mb-1 ${themeColor === 'Emerald' ? 'text-emerald-100' : 'text-primary-100'}`}>Session Duration</p>
              <p className="font-mono font-bold text-2xl">{formatTime(sessionSeconds)}</p>
            </div>
            <div>
              {sessionActive ? (
                <button 
                  onClick={() => endSession()} 
                  disabled={isCheckingIn}
                  className={`bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-xl text-base font-black transition-all shadow-lg shadow-rose-500/40 flex items-center gap-2 cursor-pointer ${isCheckingIn ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1 active:translate-y-0.5'}`}
                >
                  {isCheckingIn ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} fill="currentColor" />} 
                  Check Out
                </button>
              ) : activeLeaveStatus?.isOnLeave ? (
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-amber-200 mb-2 max-w-[180px] text-right">
                    {activeLeaveStatus.message}
                  </span>
                  <button 
                    disabled
                    className="bg-white/50 text-slate-800/50 px-8 py-3 rounded-xl text-base font-black flex items-center gap-2 cursor-not-allowed"
                  >
                    <Calendar size={16} /> 
                    On Leave
                  </button>
                </div>
              ) : !checkInAccess.hasAccess ? (
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-amber-200 mb-2 max-w-[180px] text-right">
                    Check-in access not granted today. Please contact admin.
                  </span>
                  <button 
                    disabled
                    className="bg-white/30 text-slate-800/40 px-8 py-3 rounded-xl text-base font-black flex items-center gap-2 cursor-not-allowed"
                  >
                    <Play size={16} className="opacity-40" /> 
                    Blocked
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => startSession()} 
                  disabled={isCheckingIn}
                  className={`px-8 py-3 rounded-xl text-base font-black transition-all shadow-lg shadow-black/10 flex items-center gap-2 cursor-pointer ${
                    themeColor === 'Emerald'
                      ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                      : 'bg-white text-theme-primary hover:bg-primary-50'
                  } ${isCheckingIn ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-1 active:translate-y-0.5'}`}
                >
                  {isCheckingIn ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" />} 
                  Check In {checkInAccess.accessType === 'wfh' ? '(WFH)' : ''}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top Right: Leaderboard Bento */}
        <Link to="/student/leaderboard" className={`md:col-span-12 lg:col-span-3 relative overflow-hidden rounded-3xl p-6 text-white border-t border-white/40 border-b-[3px] border-black/20 flex flex-col justify-between hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer group ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/40'
            : 'bg-gradient-to-br from-primary-500 to-theme-accent shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Trophy size={20} className={themeColor === 'Emerald' ? 'text-amber-100' : 'text-primary-100'} />
            </div>
            <h3 className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${themeColor === 'Emerald' ? 'text-amber-100' : 'text-primary-100'}`}>Leaderboard</h3>
            <p className="text-2xl font-black leading-tight">
              {analytics?.rank && analytics.rank !== 'N/A' ? `Your Rank: #${analytics.rank}` : 'View Your Ranking'}
            </p>
            {analytics?.rank && analytics.rank !== 'N/A' && (
              <p className={`text-xs font-semibold mt-2 leading-relaxed drop-shadow-sm transition-all duration-300 ${themeColor === 'Emerald' ? 'text-amber-50/90' : 'text-primary-50/90'}`}>
                {analytics.rank === 1 && "You're leading the pack! Outstanding job! 👑"}
                {analytics.rank > 1 && analytics.rank <= 3 && "So close to the top! Keep pushing! 🚀"}
                {analytics.rank > 3 && analytics.rank <= 10 && "Amazing! You are in the top 10! 🌟"}
                {analytics.rank > 10 && "Keep climbing! Daily consistency pays off! 💪"}
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between bg-black/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 group-hover:bg-black/20 transition-colors">
            <span className={`text-xs font-bold ${themeColor === 'Emerald' ? 'text-amber-50' : 'text-primary-50'}`}>Compare with peers</span>
            <ChevronRight size={16} />
          </div>
        </Link>
      </div>

      {/* Row 2: Performance Insights (4) + Mock Drives (4) + Attendance (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
        
        {/* Performance Insights */}
        <Link to="/student/grades" className={`lg:col-span-4 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col justify-between hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer block relative overflow-hidden group text-white ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/40'
            : 'bg-gradient-to-br from-primary-500 to-theme-accent shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <h3 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wider drop-shadow-sm">Performance Insights</h3>
            
            <div className="flex-1 flex flex-col justify-center gap-3">
              <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-inner">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`font-bold text-[10px] uppercase tracking-wide ${themeColor === 'Emerald' ? 'text-indigo-100' : 'text-primary-100'}`}>Average Score</span>
                    <div className="text-2xl font-black text-white leading-none mt-1 drop-shadow-md">
                      {analytics?.averageScore || 0}%
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.4)]">
                    <Target size={16} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-inner flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 bg-white/20 text-white">
                    {analytics?.performanceTrend === 'Improving' ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${themeColor === 'Emerald' ? 'text-indigo-100' : 'text-primary-100'}`}>Trend</span>
                  <span className="text-xs font-black text-white drop-shadow-sm">{analytics?.performanceTrend || 'N/A'}</span>
                </div>
                
                <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-inner flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 bg-white/20 text-white">
                    <Award size={16} strokeWidth={3} />
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${themeColor === 'Emerald' ? 'text-indigo-100' : 'text-primary-100'}`}>Grades</span>
                  <span className="text-xs font-black text-white drop-shadow-sm">{analytics?.totalGradesReceived || 0} Total</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between bg-black/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/10 group-hover:bg-black/20 transition-colors">
              <span className={`text-[10px] font-bold ${themeColor === 'Emerald' ? 'text-indigo-100' : 'text-primary-100'}`}>View Academic Reports</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Mock Drives Widget */}
        <Link to="/student/grades?tab=mockDrives" className={`lg:col-span-4 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col justify-between hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer block relative overflow-hidden group text-white ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-teal-500/40'
            : 'bg-gradient-to-br from-primary-400 to-theme-accent/95 shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform shadow-inner">
                  <Briefcase size={20} className={themeColor === 'Emerald' ? 'text-teal-100' : 'text-primary-100'} />
                </div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider drop-shadow-sm">Mock Drives</h3>
              </div>
              <span className={`text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full border border-white/20 ${themeColor === 'Emerald' ? 'text-teal-100' : 'text-primary-100'}`}>{mockScores.length} Drives</span>
            </div>

            {mockScores.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center gap-2">
                <div className="bg-white/15 px-4 py-2 rounded-2xl border border-white/20 shadow-inner text-center w-full max-w-[200px]">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-100 block">Latest Performance</span>
                  <span className="text-3xl font-black text-white leading-none mt-1 inline-block drop-shadow-md">
                    {Math.round(mockScores[0]?.percentage || 0)}%
                  </span>
                </div>
                <div className="w-full text-center mt-2">
                  <p className="text-xs font-bold truncate px-2 max-w-[220px] mx-auto text-white">{mockScores[0]?.mockDriveId?.title}</p>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${themeColor === 'Emerald' ? 'text-teal-100' : 'text-primary-100'}`}>
                    Grade: {mockScores[0]?.attended ? mockScores[0]?.grade : 'ABSENT'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-4">
                <p className="text-sm font-bold text-white drop-shadow-sm">No Mock Drives yet</p>
                <p className={`text-[10px] font-medium text-center mt-1 max-w-[180px] ${themeColor === 'Emerald' ? 'text-teal-100' : 'text-primary-100'}`}>Mock placement reports will show up here</p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between bg-black/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/10 group-hover:bg-black/20 transition-colors">
              <span className={`text-[10px] font-bold ${themeColor === 'Emerald' ? 'text-teal-100' : 'text-primary-100'}`}>View Details</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>

        {/* Attendance Widget */}
        <Link to="/attendance-tracker" className={`lg:col-span-4 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer block relative overflow-hidden group text-white ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-purple-500/40'
            : 'bg-gradient-to-br from-primary-500 to-theme-accent shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-8 -mb-8 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform shadow-inner">
                  <ClipboardCheck size={20} className={themeColor === 'Emerald' ? 'text-purple-100' : 'text-primary-100'} />
                </div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider drop-shadow-sm">Attendance</h3>
              </div>
              <span className={`text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full border border-white/20 ${themeColor === 'Emerald' ? 'text-purple-100' : 'text-primary-100'}`}>{attendanceStats.total} Days</span>
            </div>

            {/* Circular % */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="white" strokeWidth="3" strokeDasharray={`${attendanceStats.percentage} ${100 - attendanceStats.percentage}`} strokeLinecap="round" className="transition-all duration-1000" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white leading-none drop-shadow-md">{attendanceStats.percentage}%</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${themeColor === 'Emerald' ? 'text-purple-100' : 'text-primary-100'}`}>Overall</span>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-3 gap-2 w-full">
                <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10 group-hover:bg-white/15 transition-colors">
                  <p className="text-lg font-black text-white leading-none drop-shadow-sm">{attendanceStats.present}</p>
                  <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-wider mt-1">Present</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10 group-hover:bg-white/15 transition-colors">
                  <p className="text-lg font-black text-white leading-none drop-shadow-sm">{attendanceStats.absent}</p>
                  <p className="text-[9px] font-bold text-rose-200 uppercase tracking-wider mt-1">Absent</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10 group-hover:bg-white/15 transition-colors">
                  <p className="text-lg font-black text-white leading-none drop-shadow-sm">{attendanceStats.leave}</p>
                  <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-wider mt-1">Leave</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between bg-black/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/10 group-hover:bg-black/20 transition-colors">
              <span className={`text-[10px] font-bold ${themeColor === 'Emerald' ? 'text-purple-100' : 'text-primary-100'}`}>View Full Attendance</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </Link>
      </div>

      {/* Row 3: Batches Overview (4), Batch Chat (4), Leave App (4) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-6">
        <Link to="/student/my-batches" className={`md:col-span-6 lg:col-span-4 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer block min-h-[250px] relative overflow-hidden group text-white ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/40'
            : 'bg-gradient-to-br from-primary-400 to-theme-accent shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-center mb-5 shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                <Users size={16} />
              </div>
              <h3 className="text-sm font-extrabold text-white leading-none drop-shadow-sm">Batches</h3>
            </div>
            <span className={`text-[10px] font-bold bg-white/90 px-2 py-1 rounded-full shadow-sm ${themeColor === 'Emerald' ? 'text-blue-100' : 'text-primary-100'}`}>{analytics?.myBatchesCount || 0} Joined</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-center relative z-10">
            {analytics?.activeBatchesList && analytics.activeBatchesList.length > 0 ? (
              <div className="space-y-3">
                {analytics.activeBatchesList.map(b => (
                  <div key={b._id} className="bg-white/10 p-3.5 rounded-xl border border-white/20 flex items-center justify-between group/item hover:bg-white/20 transition-colors shadow-inner">
                    <span className={`font-bold text-sm text-white transition-colors drop-shadow-sm ${themeColor === 'Emerald' ? 'group-hover/item:text-blue-100' : 'group-hover/item:text-primary-100'}`}>{b.batchName}</span>
                    <span className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-0.5 rounded shadow-sm">{b.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-4 text-xs font-medium bg-white/5 rounded-xl border border-dashed ${themeColor === 'Emerald' ? 'text-blue-100 border-white/20' : 'text-primary-100 border-white/20'}`}>No active batches</div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-white/20 text-center relative z-10">
            <span className="text-[10px] font-extrabold text-white/80 group-hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-1 drop-shadow-sm">
              {analytics?.availableBatchesCount || 0} More Available to Join <ChevronRight size={12}/>
            </span>
          </div>
        </Link>

        {/* Batch Chat Bento */}
        <Link to="/student/chat" className={`md:col-span-6 lg:col-span-4 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer block relative overflow-hidden min-h-[250px] group text-white ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-pink-400 to-rose-600 shadow-lg shadow-pink-500/40'
            : 'bg-gradient-to-br from-primary-400 to-theme-accent shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                <MessageCircle size={16} />
              </div>
              <h3 className="text-sm font-extrabold text-white leading-none drop-shadow-sm">Batch Chat</h3>
            </div>
            {analytics?.recentChats > 0 && <span className="flex h-2.5 w-2.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span></span>}
          </div>

          <div className="flex-1 space-y-3 relative z-10 flex flex-col justify-center">
            {analytics?.recentMessagesList && analytics.recentMessagesList.length > 0 ? (
              analytics.recentMessagesList.map(msg => (
                <div key={msg._id} className="bg-white/10 p-3 rounded-xl border border-white/20 shadow-inner flex items-start gap-3 hover:bg-white/20 transition-colors">
                  <div className={`w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                    themeColor === 'Emerald' ? 'text-pink-600' : 'text-theme-primary'
                  }`}>{msg.senderId?.name?.charAt(0) || '?'}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold mb-0.5 ${themeColor === 'Emerald' ? 'text-pink-100' : 'text-primary-100'}`}>{msg.senderId?.name || 'User'}</p>
                    <p className="text-xs font-medium text-white truncate drop-shadow-sm">{msg.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-6 text-xs font-medium bg-white/5 rounded-xl border border-dashed ${themeColor === 'Emerald' ? 'text-pink-100 border-white/20' : 'text-primary-100 border-white/20'}`}>No recent messages</div>
            )}
          </div>
        </Link>

        {/* Leave Application Bento */}
        <Link to="/student/leaves" className={`md:col-span-12 lg:col-span-4 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer block relative overflow-hidden min-h-[250px] group text-white ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/40'
            : 'bg-gradient-to-br from-primary-400 to-theme-accent/90 shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl -mr-10 -mb-10 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/25 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center text-white">
                <Calendar size={16} />
              </div>
              <h3 className="text-sm font-extrabold text-white leading-none drop-shadow-sm">Leave Requests</h3>
            </div>
            {analytics?.pendingLeavesCount > 0 && <span className={`bg-white/90 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${themeColor === 'Emerald' ? 'text-teal-700' : 'text-theme-primary'}`}>{analytics.pendingLeavesCount} Pending</span>}
          </div>

          <div className="flex-1 flex flex-col justify-center relative z-10">
            {analytics?.latestLeave ? (
              <div className="bg-white/10 p-5 rounded-2xl border border-white/20 shadow-inner text-center group-hover:scale-[1.02] transition-transform">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 drop-shadow-sm ${themeColor === 'Emerald' ? 'text-teal-100' : 'text-primary-100'}`}>Latest Request</p>
                <p className="text-lg font-black text-white mb-1 drop-shadow-sm">{analytics.latestLeave.date}</p>
                <p className="text-xs font-medium text-white/90 truncate px-4 mb-4">"{analytics.latestLeave.reason}"</p>
                <div className="flex justify-center">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm ${
                    analytics.latestLeave.status === 'approved' 
                      ? (themeColor === 'Emerald' ? 'bg-white text-teal-600' : 'bg-white text-theme-primary') 
                      : analytics.latestLeave.status === 'rejected' 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-white/30 text-white border border-white/40'
                  }`}>
                    {analytics.latestLeave.status}
                  </span>
                </div>
              </div>
            ) : (
               <div className="text-center bg-white/5 py-6 rounded-2xl border border-dashed border-white/20">
                 <div className="w-10 h-10 rounded-full bg-white/20 shadow-inner mx-auto flex items-center justify-center text-white mb-2"><Calendar size={16}/></div>
                 <p className="text-sm font-bold text-white drop-shadow-sm">Need a break?</p>
                 <p className={`text-xs font-medium mt-1 ${themeColor === 'Emerald' ? 'text-teal-100' : 'text-primary-100'}`}>Apply for leave here</p>
               </div>
            )}
          </div>
        </Link>
      </div>

      {/* Row 4: LeetCode Daily Challenge */}
      {activeLeetcode.length > 0 && (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeLeetcode.map(problem => {
            // Calculate remaining time
            const now = new Date();
            const deadline = new Date(problem.deadline);
            const diffHours = Math.max(0, Math.floor((deadline - now) / (1000 * 60 * 60)));
            const diffMins = Math.max(0, Math.floor(((deadline - now) % (1000 * 60 * 60)) / (1000 * 60)));
            
            return (
              <div key={problem._id} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white border-t border-white/40 border-b-[3px] border-black/20 shadow-lg shadow-orange-500/40 hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-white flex items-center gap-2 drop-shadow-sm">
                        <svg className="text-white drop-shadow-sm" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                        Daily LeetCode Challenge
                      </h3>
                      {!problem.isSubmitted && (
                        <div className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded border border-white/30 flex items-center gap-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]">
                          <Clock size={12} /> {diffHours}h {diffMins}m left
                        </div>
                      )}
                    </div>
                    <p className="text-orange-100 text-sm mb-4 drop-shadow-sm">Complete today's problem to maintain your streak!</p>
                    <a href={problem.problemLink} target="_blank" rel="noreferrer" className="text-xl font-bold text-white hover:text-orange-200 transition-colors hover:underline mb-6 block drop-shadow-sm">
                      {problem.title}
                    </a>
                  </div>
                  
                  {problem.isSubmitted ? (
                    <div className="bg-white/20 border border-white/30 shadow-inner rounded-xl p-3 flex items-center gap-3 text-white font-bold">
                      <CheckCircle size={20} />
                      Challenge Completed! Streak Maintained.
                    </div>
                  ) : (
                    <div className="flex gap-3 items-center">
                      <input 
                        type="url" 
                        placeholder="Paste your solution link here..." 
                        className="flex-1 bg-black/20 border border-black/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all shadow-inner"
                        value={leetcodeLinks[problem._id] || ''}
                        onChange={(e) => setLeetcodeLinks({ ...leetcodeLinks, [problem._id]: e.target.value })}
                      />
                      <button 
                        onClick={() => handleLeetcodeSubmit(problem._id)}
                        disabled={submittingLeetcode}
                        className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0.5"
                      >
                        {submittingLeetcode ? '...' : 'Submit'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Row 5: Scores for the last 6 tasks & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Bottom Left: Smooth Area Chart for Grades */}
        <div className={`lg:col-span-5 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 flex flex-col min-h-[350px] text-white hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all block relative overflow-hidden group ${
          themeColor === 'Emerald'
            ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-blue-500/40'
            : 'bg-gradient-to-br from-primary-400 to-theme-accent shadow-lg shadow-theme-primary/40'
        }`}>
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none -ml-10 -mt-10"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-sm font-extrabold text-white drop-shadow-sm">Score History</h3>
            <button className={`text-xs font-bold bg-white px-3 py-1.5 rounded-full transition-colors shadow-sm ${
              themeColor === 'Emerald' ? 'text-blue-600 hover:bg-blue-50' : 'text-theme-primary hover:bg-primary-50'
            }`}>
              View All
            </button>
          </div>
          
          {processedChartData && processedChartData.length > 0 ? (
            <div className="flex-1 w-full mt-2 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: themeColor === 'Emerald' ? '#e0f2fe' : 'rgba(255, 255, 255, 0.7)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: themeColor === 'Emerald' ? '#e0f2fe' : 'rgba(255, 255, 255, 0.7)' }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '12px', color: '#0f172a' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#ffffff', stroke: themeColor === 'Emerald' ? 'rgba(14,165,233,1)' : (activeTheme?.primary || '#10b981'), strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={`flex-1 flex flex-col justify-center items-center relative z-10 ${themeColor === 'Emerald' ? 'text-cyan-100' : 'text-primary-100'}`}>
              <p className="text-sm font-medium">No grade data available yet.</p>
            </div>
          )}
        </div>

        {/* Bottom Right: Sleek Recent Activities Feed */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/40 shadow-lg shadow-slate-900/40 flex flex-col min-h-[350px] max-h-[350px] text-white hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all block relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <h3 className="text-sm font-extrabold text-white drop-shadow-sm">Recent Activities Feed</h3>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest drop-shadow-sm">Latest</span>
          </div>

          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
             {analytics?.notifications && analytics.notifications.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
               {analytics.notifications.map((notif, idx) => (
                 <div key={notif.id} className="flex items-start gap-4 group/item hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                   <div className="flex flex-col items-center mt-1">
                     <div className={`w-3 h-3 rounded-full border-2 border-slate-700 shadow-[0_0_8px_rgba(255,255,255,0.3)] ${notif.type === 'task' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                   </div>
                   <div className="flex-1 min-w-0 pb-1">
                     <p className="text-sm font-bold text-white truncate drop-shadow-sm">{notif.title}</p>
                     <p className="text-xs font-medium text-slate-300 mt-0.5 leading-snug drop-shadow-sm">{notif.message}</p>
                   </div>
                   <div className="text-right shrink-0">
                     <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm ${notif.type === 'grade' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                       {notif.type === 'grade' ? `+${notif.title.match(/\d+/)?.[0] || 0}` : 'New'}
                     </span>
                   </div>
                 </div>
               ))}
               </div>
             ) : (
               <div className="text-center text-slate-400 py-8 bg-white/5 rounded-xl border border-white/10 border-dashed">
                 <p className="text-sm font-medium">No recent activities.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
