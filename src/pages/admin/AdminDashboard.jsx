import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, CheckCircle, Clock, FileText, User as UserIcon, UserPlus, MessageCircle, Code, Gamepad2, Calendar, ChevronRight, RefreshCw, Activity, TrendingUp, ShieldCheck, Lock, Globe } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { themeColor, activeTheme } = useOutletContext();
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
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-400 to-theme-accent text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-theme-primary/30">
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
        <Link to="/reviews" className="md:col-span-4 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:border-theme-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center text-slate-800 dark:text-slate-100 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-theme-primary/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none"></div>
          <div className="mb-2">
            <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Review Status</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Grading overview</p>
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
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-theme-primary)' : 'rgba(148, 163, 184, 0.15)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Done</span>
                <span className="text-xl font-black text-slate-800 dark:text-white leading-none mt-1">{completionPercent}%</span>
              </div>
            </div>

            <div className="space-y-2 w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-theme-primary shadow-sm"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Graded</span>
                </div>
                <span className="font-black text-slate-700 dark:text-slate-200">{stats?.completedReviews || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Pending</span>
                </div>
                <span className="font-black text-slate-700 dark:text-slate-200">{stats?.pendingReviews || 0}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Command Center Card */}
        <div className="md:col-span-8 lg:col-span-5 relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-slate-100 shadow-sm flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Admin Command Center</p>
              <h3 className="font-black text-lg text-slate-800 dark:text-white leading-none flex items-center gap-2">SSMS Dashboard</h3>
            </div>
            <Link to="/profile" className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-150 dark:border-slate-700 text-slate-500 hover:text-theme-primary hover:border-theme-primary/40 transition-colors" title="Admin Profile">
              <UserIcon size={18} />
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-4 my-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Students</p>
              <p className="font-black text-2xl text-slate-800 dark:text-white leading-none">{stats?.totalStudents || 0}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Tasks</p>
              <p className="font-black text-2xl text-slate-800 dark:text-white leading-none">{stats?.totalTasks || 0}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/80 text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Reviews</p>
              <p className="font-black text-2xl text-slate-800 dark:text-white leading-none">{totalReviews}</p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-400 mb-1">Admin User</p>
              <p className="font-extrabold text-base text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/students" className="bg-theme-primary text-white hover:bg-theme-primary/95 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md shadow-theme-primary/20 flex items-center gap-2 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap">
                <Users size={15} /> View Students
              </Link>
            </div>
          </div>
        </div>

        {/* Attention Needed */}
        <Link to="/enrollments" className="md:col-span-6 lg:col-span-2 relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-slate-100 shadow-sm flex flex-col justify-between hover:border-theme-primary/50 transition-all cursor-pointer group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div>
            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-amber-100 dark:border-amber-950/50">
              <Activity size={18} />
            </div>
            <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-widest uppercase mb-1">Attention Needed</h3>
            <p className="text-xl font-black leading-tight text-slate-800 dark:text-white">Pending</p>
          </div>
          <div className="mt-4 space-y-2 relative z-10">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-150 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><UserPlus size={12} /> Joins</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">{stats?.joinRequestsCount || 0}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-150 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> Leaves</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">{stats?.pendingLeavesCount || 0}</span>
            </div>
          </div>
        </Link>

        {/* External Public Panels Card */}
        <div className="md:col-span-6 lg:col-span-2 relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-slate-100 shadow-sm flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div>
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-950/50">
              <Globe size={18} />
            </div>
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Public Panels</h3>
            <p className="text-xl font-black leading-tight text-slate-800 dark:text-white">External Links</p>
          </div>
          <div className="mt-4 space-y-2 relative z-10">
            <a href="/verify" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-2.5 border border-slate-150 dark:border-slate-800 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Lock size={10} className="text-slate-400" /> Verify Portal</span>
                <span className="text-[9px] text-slate-400">Passcode: SA123</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="/public" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-2.5 border border-slate-150 dark:border-slate-800 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Globe size={10} className="text-slate-400" /> Public Info</span>
                <span className="text-[9px] text-slate-400">Open resources list</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
            <a href="/student/attenence" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl p-2.5 border border-slate-150 dark:border-slate-800 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Activity size={10} className="text-slate-400" /> Attendance</span>
                <span className="text-[9px] text-slate-400">Classroom dashboard</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Row 2: Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { name: 'Students', path: '/students', icon: <Users size={16} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
          { name: 'Tasks', path: '/tasks', icon: <FileText size={16} />, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
          { name: 'Reviews', path: '/reviews', icon: <CheckCircle size={16} />, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
          { name: 'LeetCode', path: '/leetcode', icon: <Code size={16} />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
          { name: 'Attendance', path: '/attendance-logs', icon: <Clock size={16} />, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' },
          { name: 'Permissions', path: '/checkin-permissions', icon: <ShieldCheck size={16} />, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' },
          { name: 'Leaves', path: '/leaves', icon: <Calendar size={16} />, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30' },
          { name: 'Chat', path: '/chat', icon: <MessageCircle size={16} />, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/30' },
        ].map((link) => (
          <Link 
            key={link.name} 
            to={link.path}
            className="flex flex-col p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-theme-primary/50 dark:hover:border-theme-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-slate-800 dark:text-slate-100 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-theme-primary/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none transition-all group-hover:scale-150"></div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${link.color} mb-3 relative z-10 font-bold`}>
              {link.icon}
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 relative z-10 mt-auto">
              {link.name} <ChevronRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all text-theme-primary" />
            </p>
          </Link>
        ))}
      </div>

      {/* Row 3: Submission Chart + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Submission Volume Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col min-h-[350px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-48 h-48 bg-theme-primary/5 rounded-full blur-3xl pointer-events-none -ml-10 -mt-10"></div>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6 relative z-10">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Submission Volume</h3>
            <select 
              className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-250 px-3 py-1.5 rounded-full transition-colors shadow-sm cursor-pointer focus:outline-none"
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
            <div className="flex-1 w-full flex flex-col justify-center items-center text-slate-400 relative z-10">
              <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-theme-primary rounded-full mb-2"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Loading Data...</span>
            </div>
          ) : stats?.chartData && stats.chartData.length > 0 ? (
            <div className="flex-1 w-full mt-2 relative z-10 animate-in fade-in duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart key={timeframe} data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdminSubmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-theme-primary)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-theme-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-theme-accent)', opacity: 0.8 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-theme-accent)', opacity: 0.8 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-primary-200)', backgroundColor: 'var(--color-primary-50)', padding: '12px', color: 'var(--color-primary-900)' }}
                    itemStyle={{ color: 'var(--color-theme-primary)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="submissions" stroke="var(--color-theme-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAdminSubmissions)" activeDot={{ r: 6, fill: 'var(--color-theme-primary)', stroke: '#ffffff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 relative z-10">
              <p className="text-sm font-medium">No submission data available.</p>
            </div>
          )}
        </div>

        {/* Recent Activities Feed */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col min-h-[350px] max-h-[350px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
          <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Recent Activities Feed</h3>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Latest</span>
          </div>

          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 relative z-10">
             {stats?.notifications && stats.notifications.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
               {stats.notifications.map((notif, idx) => (
                 <div key={notif.id} className="flex items-start gap-4 group/item hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                   <div className="flex flex-col items-center mt-1">
                     <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${notif.type === 'task' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>
                   </div>
                   <div className="flex-1 min-w-0 pb-1">
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{notif.title}</p>
                     <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">{notif.message}</p>
                   </div>
                   <div className="text-right shrink-0">
                     <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm ${notif.type === 'task' ? 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/20' : 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/20'}`}>
                       {notif.type === 'task' ? 'New' : 'Sent'}
                     </span>
                   </div>
                 </div>
               ))}
               </div>
             ) : (
               <div className="text-center text-slate-400 py-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-150 dark:border-slate-800 border-dashed">
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
