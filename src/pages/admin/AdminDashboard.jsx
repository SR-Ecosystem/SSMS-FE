import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, CheckCircle, Clock, TrendingUp, BarChart as BarChartIcon, Bell, Activity, FileText, User as UserIcon, UserPlus, MessageCircle, Code, Gamepad2, Calendar, ChevronRight, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('daily');

  const fetchStats = async () => {
    if (!loading) setIsChartLoading(true);
    try {
      const { data } = await axios.get(`/analytics/dashboard?timeframe=${timeframe}`);
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

  if (loading) return <div className="p-8 text-slate-500 dark:text-slate-400 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;

  const reviewData = [
    { name: 'Completed', value: stats?.completedReviews || 0 },
    { name: 'Pending', value: stats?.pendingReviews || 0 },
  ];
  const COLORS = ['#10b981', '#cbd5e1'];

  const adminQuickLinks = [
    { name: 'Students', path: '/students', icon: <Users size={22} />, gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/40', hover: 'hover:shadow-blue-500/60', stat: stats?.totalStudents || 0, statLabel: 'Total' },
    { name: 'Join Requests', path: '/enrollments', icon: <UserPlus size={22} />, gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/40', hover: 'hover:shadow-indigo-500/60' },
    { name: 'Batches', path: '/batches', icon: <BookOpen size={22} />, gradient: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/40', hover: 'hover:shadow-purple-500/60', stat: stats?.totalBatches || 0, statLabel: 'Active' },
    { name: 'Chat', path: '/chat', icon: <MessageCircle size={22} />, gradient: 'from-pink-400 to-pink-600', shadow: 'shadow-pink-500/40', hover: 'hover:shadow-pink-500/60' },
    { name: 'LeetCode', path: '/leetcode', icon: <Code size={22} />, gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/40', hover: 'hover:shadow-amber-500/60' },
    { name: 'Tasks', path: '/tasks', icon: <FileText size={22} />, gradient: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-500/40', hover: 'hover:shadow-rose-500/60', stat: stats?.totalTasks || 0, statLabel: 'Assigned' },
    { name: 'Quizzes', path: '/quizzes', icon: <Gamepad2 size={22} />, gradient: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/40', hover: 'hover:shadow-orange-500/60' },
    { name: 'Reviews', path: '/reviews', icon: <CheckCircle size={22} />, gradient: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/40', hover: 'hover:shadow-emerald-500/60', stat: stats?.pendingReviews || 0, statLabel: 'Pending' },
    { name: 'Leaves', path: '/leaves', icon: <Calendar size={22} />, gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/40', hover: 'hover:shadow-teal-500/60' },
    { name: 'Attendance', path: '/attendance-logs', icon: <Clock size={22} />, gradient: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/40', hover: 'hover:shadow-cyan-500/60' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-emerald-500/30">
            {user?.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Hello, {user?.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Here's the current system status</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats()}
            disabled={isChartLoading || loading}
            className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-sm"
            title="Refresh Dashboard"
          >
            <RefreshCw size={18} className={(isChartLoading || loading) ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Row 1: Quick Links Grid */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Quick Actions & Overview</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {adminQuickLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path}
              className={`flex flex-col p-4 rounded-2xl transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br ${link.gradient} border-t border-white/40 border-b-[3px] border-black/20 shadow-lg ${link.shadow} hover:-translate-y-1 ${link.hover} hover:brightness-110 active:translate-y-1 active:border-b-0 text-white`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/25 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] backdrop-blur-sm`}>
                  {link.icon}
                </div>
                {link.stat !== undefined && (
                  <div className="text-right ml-2">
                    <span className="block text-[10px] font-bold text-white/80 uppercase tracking-widest leading-tight drop-shadow-sm">{link.statLabel}</span>
                    <span className="text-xl font-black text-white leading-none drop-shadow-md">{link.stat}</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-white mt-auto flex items-center gap-1 relative z-10 drop-shadow-sm">
                {link.name} <ChevronRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 2: Review Donut (1fr), Submissions (1fr), Recent Activities (1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Review Completion Donut */}
        <div className="glass-panel p-6 flex flex-col h-[420px]">
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Review Status</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 font-medium">Assignment grading overview</p>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-8 mt-2 flex-1">
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {reviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : 'var(--color-slate-200)'} className="dark:fill-emerald-400 dark:last:fill-slate-700" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Done</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">
                  {stats?.completedReviews + stats?.pendingReviews > 0 ? Math.round((stats.completedReviews / (stats.completedReviews + stats.pendingReviews)) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="space-y-4 w-full px-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Graded</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{stats?.completedReviews || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Pending</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{stats?.pendingReviews || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100 dark:border-white/5 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-transparent"></div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Total</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">{stats?.completedReviews + stats?.pendingReviews || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Smooth Area Chart for Submissions */}
        <div className="glass-panel p-6 flex flex-col h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Submission Volume</h3>
            <select 
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/30 px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          {isChartLoading ? (
            <div className="flex-1 w-full flex flex-col justify-center items-center text-emerald-500/50">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full mb-2"></div>
              <span className="text-xs font-bold uppercase tracking-widest">Loading Data...</span>
            </div>
          ) : stats?.chartData && stats.chartData.length > 0 ? (
            <div className="flex-1 w-full mt-2 animate-in fade-in duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={timeframe} data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="submissions" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSubmissions)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
              <p className="text-sm font-medium">No submission data available.</p>
            </div>
          )}
        </div>

        {/* Right: Sleek Recent Activities Feed */}
        <div className="glass-panel p-6 flex flex-col h-[420px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Recent Activities</h3>
            <span className="text-xs font-medium text-slate-400">Today</span>
          </div>

          <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
             {stats?.notifications && stats.notifications.length > 0 ? (
               stats.notifications.map((notif, idx) => (
                 <div key={notif.id} className="flex items-start gap-4 group">
                   <div className="flex flex-col items-center mt-1.5">
                     <div className={`w-2.5 h-2.5 rounded-full ${notif.type === 'task' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                     {idx !== stats.notifications.length - 1 && <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-700 mt-1"></div>}
                   </div>
                   <div className="flex-1 min-w-0 pb-1">
                     <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{notif.title}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{notif.message}</p>
                   </div>
                   <div className="text-right shrink-0">
                     <span className={`text-xs font-bold ${notif.type === 'task' ? 'text-indigo-500' : 'text-emerald-500'}`}>
                       {notif.type === 'task' ? 'New' : 'Sent'}
                     </span>
                   </div>
                 </div>
               ))
             ) : (
               <div className="text-center text-slate-400 py-8">
                 <p className="text-sm font-medium">No recent activities.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
