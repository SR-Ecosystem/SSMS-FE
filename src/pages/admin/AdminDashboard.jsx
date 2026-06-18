import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, CheckCircle, Clock, FileText, User as UserIcon, UserPlus, MessageCircle, Code, Gamepad2, Calendar, ChevronRight, RefreshCw, Activity, TrendingUp } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

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

  if (loading) return <SkeletonLoader type="admin-dashboard" />;

  const reviewData = [
    { name: 'Completed', value: stats?.completedReviews || 0 },
    { name: 'Pending', value: stats?.pendingReviews || 0 },
  ];

  const totalReviews = (stats?.completedReviews || 0) + (stats?.pendingReviews || 0);
  const completionPercent = totalReviews > 0 ? Math.round((stats.completedReviews / totalReviews) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
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
        <button
          onClick={() => fetchStats()}
          disabled={isChartLoading || loading}
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 shadow-sm cursor-pointer"
          title="Refresh Dashboard"
        >
          <RefreshCw size={16} className={(isChartLoading || loading) ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Row 1: Review Donut | Command Center | Attention Needed */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Review Completion Donut */}
        <Link to="/reviews" className="md:col-span-4 lg:col-span-3 bg-gradient-to-br from-emerald-400 to-emerald-600 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 shadow-lg shadow-emerald-500/40 flex flex-col items-center justify-center text-center hover:-translate-y-1 active:translate-y-1 active:border-b-0 hover:shadow-[0_12px_20px_-6px_rgba(16,185,129,0.5)] transition-all cursor-pointer block relative overflow-hidden group text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="mb-2 relative z-10">
            <h3 className="text-sm font-bold text-white mb-1 drop-shadow-sm">Review Status</h3>
            <p className="text-xs text-emerald-50 font-medium drop-shadow-sm">Grading overview</p>
          </div>
          
          <div className="flex flex-col items-center w-full gap-5 mt-2 relative z-10">
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={56}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {reviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ffffff' : 'rgba(255,255,255,0.25)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/80 font-semibold uppercase tracking-wider drop-shadow-sm">Done</span>
                <span className="text-xl font-bold text-white leading-none mt-1 drop-shadow-md">{completionPercent}%</span>
              </div>
            </div>

            <div className="space-y-3 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm"></div>
                  <span className="text-white font-semibold drop-shadow-sm">Graded</span>
                </div>
                <span className="font-bold text-white drop-shadow-sm">{stats?.completedReviews || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                  <span className="text-white font-semibold drop-shadow-sm">Pending</span>
                </div>
                <span className="font-bold text-white drop-shadow-sm">{stats?.pendingReviews || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Command Center Card */}
        <div className="md:col-span-8 lg:col-span-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-white border-t border-white/40 border-b-[3px] border-black/20 shadow-lg shadow-teal-500/40 flex flex-col group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <p className="text-teal-50 text-xs font-medium uppercase tracking-wider mb-1">Admin Command Center</p>
              <h3 className="font-bold text-lg leading-none flex items-center gap-2">SSMS Dashboard</h3>
            </div>
            <Link to="/profile" className="hover:opacity-80 transition-opacity" title="Admin Profile">
              <UserIcon size={24} className="opacity-80" />
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-inner text-center">
              <p className="text-teal-100/80 text-[10px] font-bold uppercase tracking-widest mb-1">Students</p>
              <p className="font-black text-2xl text-white leading-none drop-shadow-md">{stats?.totalStudents || 0}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-inner text-center">
              <p className="text-teal-100/80 text-[10px] font-bold uppercase tracking-widest mb-1">Batches</p>
              <p className="font-black text-2xl text-white leading-none drop-shadow-md">{stats?.totalBatches || 0}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-inner text-center">
              <p className="text-teal-100/80 text-[10px] font-bold uppercase tracking-widest mb-1">Tasks</p>
              <p className="font-black text-2xl text-white leading-none drop-shadow-md">{stats?.totalTasks || 0}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-inner text-center">
              <p className="text-teal-100/80 text-[10px] font-bold uppercase tracking-widest mb-1">Reviews</p>
              <p className="font-black text-2xl text-white leading-none drop-shadow-md">{totalReviews}</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mt-auto pt-4 border-t border-teal-400/30">
            <div>
              <p className="text-xs text-teal-100 mb-1">Admin</p>
              <p className="font-bold text-lg truncate max-w-[150px]">{user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/students" className="bg-white text-teal-600 hover:bg-teal-50 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-black/10 flex items-center gap-2 cursor-pointer hover:shadow-xl hover:-translate-y-1 active:translate-y-0.5 whitespace-nowrap">
                <Users size={16} /> View Students
              </Link>
            </div>
          </div>
        </div>

        {/* Attention Needed */}
        <Link to="/enrollments" className="md:col-span-12 lg:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white border-t border-white/40 border-b-[3px] border-black/20 shadow-lg shadow-orange-500/40 flex flex-col justify-between hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all cursor-pointer group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4 group-hover:scale-110 transition-transform shadow-inner">
              <Activity size={20} className="text-yellow-100" />
            </div>
            <h3 className="text-[10px] font-bold text-yellow-100 tracking-widest uppercase mb-1">Attention Needed</h3>
            <p className="text-2xl font-black leading-tight">Pending<br/>Requests</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between bg-black/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 group-hover:bg-black/20 transition-colors">
              <span className="text-xs font-bold text-yellow-50 flex items-center gap-2"><UserPlus size={14} /> Join Requests</span>
              <span className="text-sm font-black">{stats?.joinRequestsCount || 0}</span>
            </div>
            <div className="flex items-center justify-between bg-black/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 group-hover:bg-black/20 transition-colors">
              <span className="text-xs font-bold text-yellow-50 flex items-center gap-2"><Calendar size={14} /> Pending Leaves</span>
              <span className="text-sm font-black">{stats?.pendingLeavesCount || 0}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Row 2: Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { name: 'Students', path: '/students', icon: <Users size={20} />, gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/40', hover: 'hover:shadow-blue-500/60' },
          { name: 'Batches', path: '/batches', icon: <BookOpen size={20} />, gradient: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/40', hover: 'hover:shadow-purple-500/60' },
          { name: 'Tasks', path: '/tasks', icon: <FileText size={20} />, gradient: 'from-rose-400 to-rose-600', shadow: 'shadow-rose-500/40', hover: 'hover:shadow-rose-500/60' },
          { name: 'Reviews', path: '/reviews', icon: <CheckCircle size={20} />, gradient: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/40', hover: 'hover:shadow-emerald-500/60' },
          { name: 'LeetCode', path: '/leetcode', icon: <Code size={20} />, gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/40', hover: 'hover:shadow-amber-500/60' },
          { name: 'Quizzes', path: '/quizzes', icon: <Gamepad2 size={20} />, gradient: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/40', hover: 'hover:shadow-orange-500/60' },
          { name: 'Attendance', path: '/attendance-logs', icon: <Clock size={20} />, gradient: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/40', hover: 'hover:shadow-cyan-500/60' },
          { name: 'Leaves', path: '/leaves', icon: <Calendar size={20} />, gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/40', hover: 'hover:shadow-teal-500/60' },
          { name: 'Chat', path: '/chat', icon: <MessageCircle size={20} />, gradient: 'from-pink-400 to-pink-600', shadow: 'shadow-pink-500/40', hover: 'hover:shadow-pink-500/60' },
          { name: 'Join Requests', path: '/enrollments', icon: <UserPlus size={20} />, gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/40', hover: 'hover:shadow-indigo-500/60' },
        ].map((link) => (
          <Link 
            key={link.name} 
            to={link.path}
            className={`flex flex-col p-4 rounded-2xl transition-all cursor-pointer group relative overflow-hidden bg-gradient-to-br ${link.gradient} border-t border-white/40 border-b-[3px] border-black/20 shadow-lg ${link.shadow} hover:-translate-y-1 ${link.hover} hover:brightness-110 active:translate-y-1 active:border-b-0 text-white`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/25 text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] backdrop-blur-sm mb-3 relative z-10`}>
              {link.icon}
            </div>
            <p className="text-sm font-bold text-white mt-auto flex items-center gap-1 relative z-10 drop-shadow-sm">
              {link.name} <ChevronRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </p>
          </Link>
        ))}
      </div>

      {/* Row 3: Submission Chart + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Submission Volume Chart */}
        <div className="lg:col-span-5 bg-gradient-to-br from-cyan-400 to-blue-500 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/20 shadow-lg shadow-blue-500/40 flex flex-col min-h-[350px] text-white hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all block relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none -ml-10 -mt-10"></div>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 relative z-10">
            <h3 className="text-sm font-extrabold text-white drop-shadow-sm">Submission Volume</h3>
            <select 
              className="text-xs font-bold text-blue-600 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors shadow-sm cursor-pointer focus:outline-none"
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
            <div className="flex-1 w-full flex flex-col justify-center items-center text-white/50 relative z-10">
              <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mb-2"></div>
              <span className="text-xs font-bold uppercase tracking-widest">Loading Data...</span>
            </div>
          ) : stats?.chartData && stats.chartData.length > 0 ? (
            <div className="flex-1 w-full mt-2 relative z-10 animate-in fade-in duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={timeframe} data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdminSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#e0f2fe' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#e0f2fe' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', padding: '12px', color: '#0f172a' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="submissions" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminSubmissions)" activeDot={{ r: 6, fill: '#ffffff', stroke: 'rgba(14,165,233,1)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-cyan-100 relative z-10">
              <p className="text-sm font-medium">No submission data available.</p>
            </div>
          )}
        </div>

        {/* Recent Activities Feed */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-700 to-slate-900 p-6 rounded-3xl border-t border-white/40 border-b-[3px] border-black/40 shadow-lg shadow-slate-900/40 flex flex-col min-h-[350px] max-h-[350px] text-white hover:-translate-y-1 active:translate-y-1 active:border-b-0 transition-all block relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <h3 className="text-sm font-extrabold text-white drop-shadow-sm">Recent Activities Feed</h3>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest drop-shadow-sm">Latest</span>
          </div>

          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
             {stats?.notifications && stats.notifications.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
               {stats.notifications.map((notif, idx) => (
                 <div key={notif.id} className="flex items-start gap-4 group/item hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                   <div className="flex flex-col items-center mt-1">
                     <div className={`w-3 h-3 rounded-full border-2 border-slate-700 shadow-[0_0_8px_rgba(255,255,255,0.3)] ${notif.type === 'task' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                   </div>
                   <div className="flex-1 min-w-0 pb-1">
                     <p className="text-sm font-bold text-white truncate drop-shadow-sm">{notif.title}</p>
                     <p className="text-xs font-medium text-slate-300 mt-0.5 leading-snug drop-shadow-sm">{notif.message}</p>
                   </div>
                   <div className="text-right shrink-0">
                     <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm ${notif.type === 'task' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                       {notif.type === 'task' ? 'New' : 'Sent'}
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

export default AdminDashboard;
