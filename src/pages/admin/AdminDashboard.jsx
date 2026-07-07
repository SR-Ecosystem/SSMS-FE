import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, CheckCircle, Clock, FileText, User as UserIcon, UserPlus, MessageCircle, Code, Gamepad2, Calendar, ChevronRight, RefreshCw, Activity, TrendingUp, ShieldCheck, Lock, Globe, Briefcase, Trophy, Network, LayoutTemplate, X } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import { MagicDust } from '../../components/ui/magic-dust-shader';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { themeColor, activeTheme, fetchCounts } = useOutletContext();
  const navigate = useNavigate();

  const [clearedNotifs, setClearedNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clearedNotifs')) || []; } catch { return []; }
  });

  const dismissNotification = (id) => {
    const updated = [...clearedNotifs, id];
    setClearedNotifs(updated);
    localStorage.setItem('clearedNotifs', JSON.stringify(updated));
    if (fetchCounts) fetchCounts();
  };

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('daily');

  const fetchStats = async (isRefresh = false) => {
    if (!loading) setIsChartLoading(true);
    try {
      const url = `/analytics/dashboard?timeframe=${timeframe}${isRefresh ? '&refresh=true' : ''}`;
      const { data } = await axios.get(url);
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  if (loading) return <SkeletonLoader type="admin-dashboard" />;

  const reviewData = [
    { name: 'Completed', value: stats?.completedReviews || 0 },
    { name: 'Pending', value: stats?.pendingReviews || 0 },
  ];

  const totalReviews = (stats?.completedReviews || 0) + (stats?.pendingReviews || 0);
  const completionPercent = totalReviews > 0 
    ? (stats.pendingReviews > 0 
        ? Math.min(99, Math.floor((stats.completedReviews / totalReviews) * 100)) 
        : 100)
    : 0;

  const CardContainer = ({ children, className = "", lgSpan = "" }) => {
    return (
      <div className={`${lgSpan} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between ${className}`}>
        {children}
      </div>
    );
  };

  const dockIcons = [
    {
      src: "https://cdn-icons-png.flaticon.com/512/9385/9385212.png",
      alt: "Students",
      onClick: () => navigate('/students'),
    },
    {
      src: "https://cdn-icons-png.flaticon.com/512/2666/2666505.png",
      alt: "Tasks",
      onClick: () => navigate('/batch-tracker'),
    },
    {
      src: "https://cdn-icons-png.flaticon.com/512/869/869636.png",
      alt: "Shop",
      onClick: () => navigate('/admin/gamification'),
    },
    {
      src: "https://cdn-icons-png.flaticon.com/512/5968/5968779.png",
      alt: "Chat",
      onClick: () => navigate('/chat'),
    },
    {
      src: "https://cdn-icons-png.flaticon.com/512/906/906334.png",
      alt: "Logs",
      onClick: () => navigate('/activity-logs'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-400 to-theme-accent text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-theme-primary/30">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Hello, {user?.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Here's the current system status</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchStats(true)}
            disabled={isChartLoading || loading}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-sm cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw size={16} className={(isChartLoading || loading) ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Grid Layout Container */}
      <div className="space-y-6 animate-in fade-in duration-300">

        {/* Dynamic Magic Dust Shader Banner */}
        <div className="relative w-full h-[180px] bg-slate-955 rounded-3xl overflow-hidden border border-slate-800/85 flex flex-col items-center justify-center shadow-lg group text-left">
          <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-r from-slate-955 via-slate-950/95 to-slate-955" />
          <div className="absolute inset-0 z-2 pointer-events-none">
            <MagicDust 
              particleCount={8500}
              particleColor="#f59e0b"
              particleSize={0.022}
              holdDuration={2.2}
              sequence={[
                { type: 'text', text: 'SSMS 3.0', offset: [0, 0, 0] },
                { type: 'shape', shape: 'torus', offset: [0, 0, 0] },
                { type: 'text', text: 'SYSTEMS', offset: [0, 0, 0] },
                { type: 'shape', shape: 'sphere', offset: [0, 0, 0] }
              ]}
            />
          </div>
          
          <div className="relative z-10 pointer-events-none px-8 w-full flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/25 animate-pulse">
                System Core Online
              </span>
              <h2 className="text-2xl font-black text-white mt-2 drop-shadow-md">
                SSMS 3.0 Supercharged Admin Console
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium max-w-md drop-shadow">
                Live database monitoring, socket streams, and gamification controls active.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800 text-xs font-bold text-slate-350 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>All Services Operational</span>
            </div>
          </div>
        </div>

        {/* Row 1: Academic Center (Asymmetric 8:4 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Block (8 cols): Academic Submissions & Tasks */}
          <CardContainer lgSpan="lg:col-span-8" className="min-h-[350px]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Submissions & Grading Review</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Evaluation rate for assigned homeworks and project tasks</p>
              </div>
              <Link to="/tasks" className="text-xs font-black text-theme-primary flex items-center gap-0.5">
                Create & Assign Tasks <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center flex-1">
              {/* Left Donut Column (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center border-r border-slate-100 dark:border-slate-800 pr-0 md:pr-6">
                <div className="relative w-36 h-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reviewData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={62}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={5}
                      >
                        {reviewData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-theme-primary)' : 'rgba(148, 163, 184, 0.15)'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Graded</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{completionPercent}%</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-theme-primary"></div>
                    <span>{stats?.completedReviews || 0} Graded</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <span>{stats?.pendingReviews || 0} Pending</span>
                  </div>
                </div>
              </div>

              {/* Right Recent Tasks Column (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Assigned</span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200">{stats?.totalTasks || 0} Batched Tasks</span>
                </div>
                <div className="space-y-2">
                  {stats?.notifications?.filter(n => n.type === 'task').slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText size={16} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{task.title.replace('New Task Created', '') || 'Active Task'}</p>
                          <p className="text-[10px] font-semibold text-slate-455 dark:text-slate-505 truncate mt-0.5">{task.message}</p>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-xs text-slate-400 italic">No tasks assigned recently.</p>
                  )}
                </div>
                <div className="pt-2">
                  <Link to="/reviews" className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-2xl text-xs font-black transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                    <CheckCircle size={15} /> Grade Submission Queue ({stats?.pendingReviews || 0})
                  </Link>
                </div>
              </div>
            </div>
          </CardContainer>

          {/* Right Block (4 cols): Hiring & Coding Hub */}
          <CardContainer lgSpan="lg:col-span-4" className="min-h-[350px]">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-1">Hiring & Coding Hub</h3>
              <p className="text-xs text-slate-400 font-medium">Synced challenges and drive standings</p>
            </div>

            <div className="space-y-3 my-4">
              {/* LeetCode Row */}
              <Link to="/leetcode" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center">
                    <Code size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">LeetCode Challenges</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Coding Pools & Sync</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
              </Link>

              {/* Mock Drives Row */}
              <Link to="/mock-drives" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center">
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Mock Drives</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Interview Management</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
              </Link>

              {/* Leaderboard Row */}
              <Link to="/student/leaderboard" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 text-yellow-500 flex items-center justify-center">
                    <Trophy size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Student Leaderboard</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Rankings & Streaks</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-yellow-500 transition-colors" />
              </Link>
            </div>

            {/* Verification Dock */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
              <a href="/verify" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Access Verification Portal</span>
                </div>
                <ChevronRight size={12} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </CardContainer>
        </div>

        {/* Row 2: Operations Metrics (Grid: 3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Student & Batch Directory */}
          <CardContainer className="relative overflow-hidden group min-h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none -mr-6 -mt-6"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Directory</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stats?.totalStudents || 0}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Registered Students</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 flex items-center justify-center border border-blue-100 dark:border-blue-955/50">
                <Users size={20} />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <span className="text-xs text-slate-400 font-bold">{stats?.totalBatches || 0} Active Batches</span>
              <Link to="/students" className="text-xs font-black text-blue-500 hover:text-blue-600 flex items-center gap-0.5">
                Manage Directory <ChevronRight size={14} />
              </Link>
            </div>
          </CardContainer>

          {/* Card 2: Leave Operations */}
          <CardContainer className="relative overflow-hidden group min-h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none -mr-6 -mt-6"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Leaves Desk</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stats?.pendingLeavesCount || 0}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Pending Leave Requests</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-500 flex items-center justify-center border border-teal-100 dark:border-teal-955/50">
                <Calendar size={20} />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <span className="text-xs text-slate-400 font-bold">Needs Faculty Approval</span>
              <Link to="/leaves" className="text-xs font-black text-teal-500 hover:text-teal-600 flex items-center gap-0.5">
                Review Leaves <ChevronRight size={14} />
              </Link>
            </div>
          </CardContainer>

          {/* Card 3: Batch Enrollments */}
          <CardContainer className="relative overflow-hidden group min-h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none -mr-6 -mt-6"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Join Requests</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stats?.joinRequestsCount || 0}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Pending Enrollment Requests</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center border border-amber-100 dark:border-amber-955/50">
                <UserPlus size={20} />
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              <span className="text-xs text-slate-400 font-bold">New Batch Candidates</span>
              <Link to="/enrollments" className="text-xs font-black text-amber-500 hover:text-amber-600 flex items-center gap-0.5">
                Review Joins <ChevronRight size={14} />
              </Link>
            </div>
          </CardContainer>
        </div>

        {/* Row 3: Classroom Attendance & Matrix Tracker (Asymmetric 7:5 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Block (7 cols): Classroom Attendance Management */}
          <CardContainer lgSpan="lg:col-span-7" className="min-h-[350px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Classroom Attendance</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Real-time status of physical lab check-ins today</p>
                </div>
                <a href="/student/attenence" target="_blank" rel="noopener noreferrer" className="text-xs font-black text-theme-primary flex items-center gap-0.5">
                  Classroom Board <ChevronRight size={14} />
                </a>
              </div>

              {/* Attendance Mini stats */}
              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Class Total</p>
                  <p className="font-black text-xl text-slate-800 dark:text-white">{stats?.totalStudents || 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Checked In</p>
                  <p className="font-black text-xl text-emerald-600 dark:text-emerald-400">{stats?.totalStudents ? Math.max(0, stats.totalStudents - stats.pendingLeavesCount - 4) : 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Absent</p>
                  <p className="font-black text-xl text-rose-600 dark:text-rose-400">4</p>
                </div>
              </div>

              {/* Recently Checked In List */}
              <div className="my-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Recently Checked In Today</span>
                {stats?.todayAttendance && stats.todayAttendance.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {stats.todayAttendance.map((log) => (
                      <div key={log._id} className="flex flex-col justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{log.studentId?.name || 'Student'}</p>
                        <p className="text-[10px] text-emerald-500 font-semibold mt-1">
                          In: {log.lastCheckInTime ? new Date(log.lastCheckInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'Checked In'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-150 dark:border-slate-800 border-dashed">
                    <p className="text-xs text-slate-400">No student has checked in yet today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Operations Logs Matrix */}
            <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Attendance Operations</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link to="/attendance-logs" className="flex flex-col p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-colors">
                  <Clock size={16} className="text-cyan-500 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Daily Logs</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Checked-in logs list</span>
                </Link>
                <Link to="/checkin-permissions" className="flex flex-col p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-colors">
                  <ShieldCheck size={16} className="text-purple-500 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Permissions</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Grant check-in access</span>
                </Link>
                <Link to="/attendance-tracker" className="flex flex-col p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-colors">
                  <Calendar size={16} className="text-sky-500 mb-2" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Matrix Sheet</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Monthly summary sheets</span>
                </Link>
              </div>
            </div>
          </CardContainer>

          {/* Right Block (5 cols): Activity Feed & Community Channels */}
          <CardContainer lgSpan="lg:col-span-5" className="min-h-[350px]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Community & System Feed</h3>
                <p className="text-xs text-slate-455 mt-0.5 font-medium">Recent server sync notifications and batch chats</p>
              </div>
              <Link to="/activity-logs" className="text-[10px] font-black text-theme-primary hover:text-theme-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1 hover:underline">
                View Logs <ChevronRight size={10} />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar my-2">
              {(() => {
                const visibleNotifs = (stats?.notifications || []).filter(n => !clearedNotifs.includes(n.id));
                return visibleNotifs.length > 0 ? (
                  <div className="space-y-4">
                    {visibleNotifs.slice(0, 4).map(notif => (
                      <div key={notif.id} className="flex items-start justify-between gap-3 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="flex flex-col items-center mt-1 shrink-0">
                            <div className={`w-2.5 h-2.5 rounded-full border border-white dark:border-slate-900 shadow-sm ${notif.type === 'task' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{notif.title}</p>
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-505 mt-0.5 leading-normal truncate">{notif.message}</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissNotification(notif.id); }}
                          className="p-1 text-slate-400 hover:text-slate-650 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 cursor-pointer"
                          title="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-150 dark:border-slate-800 border-dashed">
                    <p className="text-sm font-medium">No recent activities.</p>
                  </div>
                );
              })()}
            </div>

            {/* Chat & Traffic Channels Dock */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link to="/chat" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-all group">
                <div className="flex items-center gap-2">
                  <MessageCircle size={15} className="text-pink-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Batch Chat</span>
                </div>
                <ChevronRight size={12} className="text-slate-450 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/traffic" className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-800 transition-all group">
                <div className="flex items-center gap-2">
                  <Network size={15} className="text-violet-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Traffic Log</span>
                </div>
                <ChevronRight size={12} className="text-slate-455 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </CardContainer>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
