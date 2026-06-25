import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Lock, Loader2, Users, Activity, CheckCircle, Clock, ShieldCheck, Search, Code, GitBranch, Globe, Terminal, XCircle, Layout, ArrowRight, BookOpen, TrendingUp, Cpu, BarChart3, FileText, ClipboardList, Award, Eye, Timer, UserCheck, UserX, Hash, Calendar, ChevronDown, ChevronRight, RefreshCw, GraduationCap, Briefcase, Building2, Flame } from 'lucide-react';
import * as XLSX from 'xlsx';
import SkeletonLoader from '../components/SkeletonLoader';

const PASSCODE = 'SA123';

// ─── Helpers ──────────────────────────────────────────────
const formatTime = (totalSeconds) => {
  if (!totalSeconds) return '0min';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}hr ${m}min`;
  return `${m}min`;
};

const formatScore = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return String(Math.round((Number(val) + Number.EPSILON) * 100) / 100);
};

const timeAgo = (date) => {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const statusColor = (status) => {
  const map = { graded: 'emerald', submitted: 'amber', resubmit: 'rose' };
  const c = map[status] || 'slate';
  return `bg-${c}-500/20 text-${c}-400 border-${c}-500/30`;
};

// ─── Sidebar Items ────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Layout },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'batches', label: 'Batches', icon: Cpu },
  { id: 'live', label: 'Live Activity', icon: Activity },
  { id: 'attendance', label: 'Attendance', icon: UserCheck },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'submissions', label: 'Submissions', icon: FileText },
  { id: 'grades', label: 'Grades', icon: Award },
  { id: 'mockDrives', label: 'Mock Tests', icon: Briefcase },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'logs', label: 'Activity Logs', icon: Clock },
];

// ═══════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const Verification = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search / Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Student detail modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Mock Drive filter states
  const [mockBatchFilter, setMockBatchFilter] = useState('');
  const [mockDriveFilter, setMockDriveFilter] = useState('');
  const [mockStatusFilter, setMockStatusFilter] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode.toUpperCase() === PASSCODE) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid passcode.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: d } = await axios.get('/public/monitor');
      setData(d);
    } catch { setError('Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  const openStudentProfile = async (rollNumber) => {
    setSelectedStudent(rollNumber);
    setStudentDetails(null);
    setDetailsLoading(true);
    try {
      const { data: d } = await axios.get(`/public/verify/${encodeURIComponent(rollNumber)}`);
      setStudentDetails(d);
    } catch { /* silent */ }
    finally { setDetailsLoading(false); }
  };

  const exportToExcel = () => {
    if (!filteredStudents || filteredStudents.length === 0) return;
    
    const dataToExport = filteredStudents.map(student => {
      const batch = batches.find(b => student.batchId && b._id === student.batchId.toString());
      return {
        'Roll Number': student.rollNumber || 'N/A',
        'Student Name': student.name,
        'Email Address': student.email || 'N/A',
        'Phone Number': student.phone || 'N/A',
        'Batch': batch ? batch.batchName : 'N/A',
        'Status': student.isActive ? 'Active' : 'Offline',
        'Attendance (Days Present)': student.daysPresent || 0,
        'Total Logged Time': formatTime(student.totalSeconds),
        'Avg Assignment Grade (%)': `${student.avgGrade || 0}%`,
        'LeetCode Streak (Days)': student.leetcodeStreak || 0,
        'LeetCode Solved': student.totalLeetcodeSubmissions || 0,
        'LeetCode Score': (student.leetcodeStreak || 0) * 10,
        'Mock Drive Total Marks': student.totalMockDriveScore || 0,
        'Overall Score': student.overallScore || 0
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student_Monitoring_Report");
    XLSX.writeFile(workbook, `Student_Monitoring_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6"><ShieldCheck size={32} /></div>
          <h1 className="text-2xl font-bold text-white text-center mb-1">Monitoring Center</h1>
          <p className="text-slate-400 text-center text-sm mb-8">Read-only command center for training managers, HR, and program coordinators.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter Passcode..." className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors" required />
            </div>
            {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">Access Monitoring Center</button>
          </form>
        </div>
      </div>
    );
  }

  // ─── LOADING ─────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8 relative">
        <div className="absolute top-8 z-10 flex items-center gap-2 bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-full border border-indigo-500/30 animate-pulse">
          <Loader2 size={16} className="animate-spin" /><span className="text-sm font-bold">Connecting to Live Systems & Syncing Data...</span>
        </div>
        <div className="w-full max-w-7xl mt-12 opacity-50"><SkeletonLoader type="admin-dashboard" /></div>
      </div>
    );
  }

  const { stats, students, activeStudents, submissions, tasks, batches, activityTimeline, leetcodeProblems, leetcodeSubmissions, mockDriveScores = [] } = data;

  const uniqueMockDrives = useMemo(() => {
    if (!mockDriveScores) return [];
    const map = new Map();
    mockDriveScores.forEach(score => {
      if (score.mockDriveId && score.mockDriveId._id) {
        map.set(score.mockDriveId._id.toString(), score.mockDriveId);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [mockDriveScores]);

  const filteredMockScores = useMemo(() => {
    if (!mockDriveScores) return [];
    let list = [...mockDriveScores];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(score => 
        (score.studentId?.name || '').toLowerCase().includes(term) ||
        (score.studentId?.rollNumber || '').toLowerCase().includes(term)
      );
    }

    if (mockBatchFilter) {
      list = list.filter(score => {
        const bId = score.studentId?.batchId;
        const bIdStr = bId && bId._id ? bId._id.toString() : bId?.toString();
        return bIdStr === mockBatchFilter;
      });
    }

    if (mockDriveFilter) {
      list = list.filter(score => 
        score.mockDriveId?._id?.toString() === mockDriveFilter
      );
    }

    if (mockStatusFilter) {
      const isAttended = mockStatusFilter === 'attended';
      list = list.filter(score => score.attended === isAttended);
    }

    list.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
    return list;
  }, [mockDriveScores, searchTerm, mockBatchFilter, mockDriveFilter, mockStatusFilter]);

  const rankedScores = useMemo(() => {
    let currentRank = 1;
    let prevPercentage = null;
    return filteredMockScores.map((score, index) => {
      if (prevPercentage !== null && score.percentage !== prevPercentage) {
        currentRank = index + 1;
      }
      prevPercentage = score.percentage;
      return {
        ...score,
        rank: score.attended ? currentRank : '-'
      };
    });
  }, [filteredMockScores]);

  const exportMockResultsToExcel = () => {
    if (!rankedScores || rankedScores.length === 0) return;

    const dataToExport = rankedScores.map(score => {
      const batch = batches.find(b => {
        const studentBatch = score.studentId?.batchId;
        const bIdStr = studentBatch && studentBatch._id ? studentBatch._id.toString() : studentBatch?.toString();
        return bIdStr && b._id === bIdStr;
      });

      return {
        'Rank': score.rank,
        'Roll Number': score.studentId?.rollNumber || 'N/A',
        'Student Name': score.studentId?.name || 'N/A',
        'Batch': batch ? batch.batchName : 'N/A',
        'Mock Test Title': score.mockDriveId?.title || 'N/A',
        'Attendance': score.attended ? 'Attended' : 'Absent',
        'MCQ Score': score.attended ? score.mcq : 0,
        'Coding Score': score.attended ? score.coding : 0,
        'Tech HR Score': score.attended ? score.techHr : 0,
        'HR Score': score.attended ? score.hr : 0,
        'Total Marks': score.attended ? score.totalMarks : 0,
        'Percentage': score.attended ? `${score.percentage}%` : '0%',
        'Grade': score.attended ? score.grade : 'Fail',
        'Date': score.mockDriveId?.date ? new Date(score.mockDriveId.date).toLocaleDateString() : 'N/A'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mock_Test_Wise_Results");
    XLSX.writeFile(workbook, `Mock_Test_Wise_Results_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const renderMockDrivesModule = () => {
    const totalDrives = uniqueMockDrives.length;
    const totalRegistered = rankedScores.length;
    const totalAttended = rankedScores.filter(s => s.attended).length;
    const attendedScores = rankedScores.filter(s => s.attended && s.percentage !== undefined);
    const avgPercentage = attendedScores.length > 0 
      ? Math.round(attendedScores.reduce((sum, s) => sum + s.percentage, 0) / attendedScores.length)
      : 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Mock Test Wise Results</h2>
            <p className="text-sm text-slate-400">View and analyze students' weekly placement mock drive performances.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <button onClick={exportMockResultsToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg py-2 px-3.5 transition-colors flex items-center gap-1.5 shadow-md animate-fade-in">
              <FileText size={16} /> Export Results
            </button>
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input type="text" placeholder="Search student..." className="w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500" value={mockBatchFilter} onChange={(e) => setMockBatchFilter(e.target.value)}>
              <option value="">All Batches</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
            </select>
            <select className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500" value={mockDriveFilter} onChange={(e) => setMockDriveFilter(e.target.value)}>
              <option value="">All Mock Drives</option>
              {uniqueMockDrives.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
            </select>
            <select className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500" value={mockStatusFilter} onChange={(e) => setMockStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="attended">Attended</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Mock Test Drives', value: totalDrives, color: 'purple' },
            { label: 'Total Registered', value: totalRegistered, color: 'indigo' },
            { label: 'Total Attended', value: totalAttended, color: 'emerald' },
            { label: 'Average Score', value: `${avgPercentage}%`, color: 'amber' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center hover:border-slate-600 transition-colors">
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-black text-${stat.color}-400`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead>
                <tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-700">
                  <th className="py-3.5 px-4 text-center">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4">Mock Test</th>
                  <th className="py-3.5 px-4 text-center">MCQ</th>
                  <th className="py-3.5 px-4 text-center">Coding</th>
                  <th className="py-3.5 px-4 text-center">Tech HR</th>
                  <th className="py-3.5 px-4 text-center">HR</th>
                  <th className="py-3.5 px-4 text-center">Total Marks</th>
                  <th className="py-3.5 px-4 text-center">Percentage</th>
                  <th className="py-3.5 px-4 text-center">Grade</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {rankedScores.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="text-center text-slate-500 py-12">No mock test scores match the selected filters.</td>
                  </tr>
                ) : (
                  rankedScores.map((score, idx) => {
                    const studentBatch = batches.find(b => {
                      const bId = score.studentId?.batchId;
                      const bIdStr = bId && bId._id ? bId._id.toString() : bId?.toString();
                      return bIdStr && b._id === bIdStr;
                    });

                    return (
                      <tr key={score._id || idx} className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          {score.attended ? `#${score.rank}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => score.studentId?.rollNumber && openStudentProfile(score.studentId.rollNumber)} className="flex items-center gap-3 hover:text-indigo-400 transition-colors text-left focus:outline-none">
                            <div className="w-8 h-8 rounded-full bg-slate-700 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-600">
                              {score.studentId?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white leading-tight">{score.studentId?.name || 'Unknown student'}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{score.studentId?.rollNumber || 'N/A'}</p>
                            </div>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-slate-300 max-w-[120px] truncate">{studentBatch ? studentBatch.batchName : 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm text-indigo-400 font-semibold max-w-[180px] truncate">{score.mockDriveId?.title || 'Mock Drive'}</p>
                            <p className="text-[10px] text-slate-500">{score.mockDriveId?.date ? new Date(score.mockDriveId.date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-300">
                          {score.attended ? formatScore(score.mcq) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-300">
                          {score.attended ? formatScore(score.coding) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-300">
                          {score.attended ? formatScore(score.techHr) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-300">
                          {score.attended ? formatScore(score.hr) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white">
                          {score.attended ? `${formatScore(score.totalMarks)} / ${score.mockDriveId?.maxMarks || 749}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-emerald-400">
                          {score.attended ? `${formatScore(score.percentage)}%` : '0%'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            !score.attended ? 'bg-slate-700/50 text-slate-400' :
                            score.grade === 'Pass' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {score.attended ? score.grade : 'Fail'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            score.attended 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {score.attended ? 'Attended' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Filtered data helpers
  const filteredStudents = students.filter(s => {
    const matchSearch = (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchBatch = !batchFilter || (s.batchId && s.batchId.toString() === batchFilter);
    const matchStatus = !statusFilter || (statusFilter === 'active' ? s.isActive : !s.isActive);
    return matchSearch && matchBatch && matchStatus;
  });

  const filteredSubmissions = submissions.filter(s => {
    const matchSearch = (s.studentId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (s.taskId?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ─── RENDER MODULES ──────────────────────────────────────
  const renderModule = () => {
    switch (activeModule) {

      // ═══ DASHBOARD ═══════════════════════════════════════
      case 'dashboard': return (
        <div className="space-y-6">
          {/* Training Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Trainer</p><p className="text-sm text-white font-bold">Saran Velmurugan</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Batch</p><p className="text-sm text-indigo-400 font-bold">Python Full Stack Dev</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Organising</p><p className="text-sm text-emerald-400 font-bold">Ethnotech Academic Sol.</p></div>
            <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Duration</p><p className="text-sm text-white font-bold">2 Months</p></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[
              { label: 'Total Students', value: stats.totalStudents, color: 'indigo' },
              { label: 'Active Now', value: stats.activeStudents, color: 'emerald', pulse: true },
              { label: 'Offline', value: stats.offlineStudents, color: 'slate' },
              { label: 'Total Batches', value: stats.totalBatches, color: 'purple' },
              { label: 'Total Tasks', value: stats.totalTasks, color: 'blue' },
              { label: 'Pending Reviews', value: stats.pendingReviews, color: 'amber' },
              { label: 'Completed Reviews', value: stats.completedReviews, color: 'emerald' },
              { label: 'Total Submissions', value: stats.totalSubmissions, color: 'cyan' },
              { label: 'Avg Attendance', value: `${stats.avgAttendanceDays}d`, color: 'teal' },
              { label: 'Avg Performance', value: `${stats.avgPerformance}%`, color: 'orange' },
              { label: 'Avg Mock Drive', value: `${stats.avgMockDriveScore || 0}%`, color: 'purple' },
              { label: 'Top LC Streak', value: `${stats.topLeetcodeStreak || 0}d`, color: 'orange' },
              { label: 'Total LC Solved', value: stats.totalLeetcodeSolved || 0, color: 'amber' },
            ].map((stat, i) => (
              <div key={i} className={`bg-slate-800 border border-slate-700 rounded-2xl p-4 relative overflow-hidden ${stat.pulse ? 'border-b-4 border-b-emerald-500' : ''}`}>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-2xl font-black text-${stat.color}-400`}>{stat.value}</p>
                {stat.pulse && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
              </div>
            ))}
          </div>

          {/* Real-time overview + Recent Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col h-[420px]">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Tracking ({activeStudents.length})
              </h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {activeStudents.length === 0 ? <p className="text-slate-500 text-sm text-center mt-8">No students active right now.</p> :
                  activeStudents.map(log => (
                    <div key={log._id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30 text-sm">{log.studentId?.name?.charAt(0) || '?'}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{log.studentId?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.studentId?.rollNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-400">{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col h-[420px]">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" /> Today's Activity Timeline
              </h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {activityTimeline.length === 0 ? <p className="text-slate-500 text-sm text-center mt-8">No activity recorded today.</p> :
                  activityTimeline.slice(0, 50).map((event, i) => (
                    <div key={i} className="flex items-start gap-3 p-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                        event.type === 'check-in' ? 'bg-emerald-500/20 text-emerald-400' :
                        event.type === 'check-out' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {event.type === 'check-in' ? <UserCheck size={14} /> : event.type === 'check-out' ? <UserX size={14} /> : <FileText size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{event.description}</p>
                        <p className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {event.rollNumber}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Top Performers + Submission Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 md:col-span-2 flex flex-col h-[280px]">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <Award size={16} className="text-amber-400" /> Leaderboard (Top 5)
              </h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="py-2 px-3 text-center">Rank</th>
                        <th className="py-2 px-3">Student</th>
                        <th className="py-2 px-3 text-center">Tasks</th>
                        <th className="py-2 px-3 text-center">LeetCode</th>
                        <th className="py-2 px-3 text-center">Mock Drives</th>
                        <th className="py-2 px-3 text-center">Overall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...students]
                        .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
                        .slice(0, 5)
                        .map((s, idx) => (
                          <tr key={s._id} className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                            <td className="py-2 px-3 text-center font-bold text-slate-400">#{idx + 1}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[9px]">
                                  {s.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate max-w-[120px]">{s.name}</p>
                                  <p className="text-[9px] text-orange-500 font-medium flex items-center gap-0.5">🔥 {s.leetcodeStreak || 0}d</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-300">{formatScore(s.totalTaskScore)}</td>
                            <td className="py-2 px-3 text-center text-slate-300">{(s.leetcodeStreak || 0) * 10}</td>
                            <td className="py-2 px-3 text-center text-slate-300">{formatScore(s.totalMockDriveScore)}</td>
                            <td className="py-2 px-3 text-center font-black text-emerald-400">{formatScore(s.overallScore)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2"><Activity size={16} className="text-indigo-400" /> Submission Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Graded', count: stats.completedReviews, color: 'emerald' },
                  { label: 'Pending', count: stats.pendingReviews, color: 'amber' },
                  { label: 'Resubmit', count: submissions.filter(s => s.status === 'resubmit').length, color: 'rose' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 font-bold uppercase">{item.label}</span>
                    <span className={`font-black text-${item.color}-400`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

      case 'students': return (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-lg font-bold text-white">Student Monitoring ({filteredStudents.length})</h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg py-2 px-3.5 transition-colors flex items-center gap-1.5 shadow-md">
                <FileText size={16} /> Export Excel
              </button>
              <div className="relative flex-1 sm:flex-none sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="text" placeholder="Search..." className="w-full bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <select className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                <option value="">All Batches</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
              </select>
              <select className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const batch = batches.find(b => student.batchId && b._id === student.batchId.toString());
              return (
                <div key={student._id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors relative overflow-hidden">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border ${student.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm truncate">{student.name}</p>
                        {student.isActive && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>}
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{student.rollNumber}</p>
                      <p className="text-[10px] text-slate-500 truncate mb-1">{student.email}</p>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-500">
                        <Flame size={12} fill="currentColor" className="text-orange-500 animate-pulse" />
                        <span>{student.leetcodeStreak || 0}d Streak ({student.totalLeetcodeSubmissions || 0} Solved)</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${student.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {student.isActive ? 'Active' : 'Offline'}
                    </span>
                  </div>
 
                  <div className="grid grid-cols-4 gap-1.5 mb-4">
                    <div className="bg-slate-900/60 p-1.5 rounded-lg text-center border border-slate-700/30">
                      <p className="text-xs font-black text-indigo-400">{student.daysPresent}d</p>
                      <p className="text-[8px] text-slate-500 uppercase tracking-wider">Attend.</p>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg text-center border border-slate-700/30">
                      <p className="text-xs font-black text-amber-400">{student.avgGrade}%</p>
                      <p className="text-[8px] text-slate-500 uppercase tracking-wider">Avg Grade</p>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg text-center border border-slate-700/30">
                      <p className="text-xs font-black text-purple-400">{formatScore(student.totalMockDriveScore)}</p>
                      <p className="text-[8px] text-slate-500 uppercase tracking-wider">Mock Dr.</p>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg text-center border border-slate-700/30">
                      <p className="text-xs font-black text-emerald-400">{formatScore(student.overallScore)}</p>
                      <p className="text-[8px] text-slate-500 uppercase tracking-wider">Overall</p>
                    </div>
                  </div>
 
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {student.leetcode && <a href={student.leetcode} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-[#ffa116] hover:text-white text-slate-400 rounded transition-colors"><Code size={12} /></a>}
                      {student.github && <a href={student.github} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-white hover:text-black text-slate-400 rounded transition-colors"><GitBranch size={12} /></a>}
                      {student.linkedin && <a href={student.linkedin} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-[#0a66c2] hover:text-white text-slate-400 rounded transition-colors"><Globe size={12} /></a>}
                    </div>
                    <button onClick={() => openStudentProfile(student.rollNumber)} className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-lg transition-colors border border-indigo-500/30 flex items-center gap-1">
                      <Eye size={12} /> View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

      // ═══ BATCHES ══════════════════════════════════════════
      case 'batches': return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Batch Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {batches.map(batch => (
              <div key={batch._id} className="bg-slate-800 border border-slate-700 p-5 rounded-2xl hover:border-emerald-500/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-white">{batch.batchName}</h3>
                    <p className="text-xs text-slate-400">{batch.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${batch.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>{batch.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Students', value: batch.studentCount, color: 'white' },
                    { label: 'Live Now', value: batch.activeCount, color: 'emerald' },
                    { label: 'Tasks', value: batch.taskCount, color: 'indigo' },
                    { label: 'Avg Grade', value: `${batch.avgGrade}%`, color: 'amber' },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900 rounded-lg p-3 text-center">
                      <p className={`text-lg font-black text-${item.color}-400`}>{item.value}</p>
                      <p className="text-[9px] text-slate-500 uppercase">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs text-slate-400 border-t border-slate-700 pt-3">
                  <span>{batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}</span>
                  <span>→</span>
                  <span>{batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      // ═══ LIVE ACTIVITY ═══════════════════════════════════
      case 'live': return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Activity Center
            </h2>
            <button onClick={fetchData} className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 flex items-center gap-1"><RefreshCw size={12} /> Refresh</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeStudents.length === 0 ? <p className="col-span-full text-center text-slate-500 py-12">No students currently active.</p> :
              activeStudents.map(log => {
                const student = students.find(s => log.studentId && s._id === log.studentId._id.toString());
                const lastSub = submissions.find(s => student && s.studentId && s.studentId._id.toString() === student._id);
                return (
                  <div key={log._id} className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-[100px]"></div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">{log.studentId?.name?.charAt(0) || '?'}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{log.studentId?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.studentId?.rollNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Status</span><span className="text-emerald-400 font-bold">● Active</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Checked In</span><span className="text-white font-bold">{log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span></div>
                      {lastSub && <div className="flex justify-between text-xs"><span className="text-slate-500">Last Task</span><span className="text-indigo-400 font-bold truncate ml-2">{lastSub.taskId?.title}</span></div>}
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Last Activity</span><span className="text-slate-300 font-bold">{timeAgo(log.lastCheckInTime || log.checkInTime)}</span></div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      );

      // ═══ ATTENDANCE ══════════════════════════════════════
      case 'attendance': return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Attendance Monitoring</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead><tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Days Present</th>
                  <th className="py-3 px-4 font-semibold text-center">Total Time</th>
                  <th className="py-3 px-4 font-semibold text-center">Avg Grade</th>
                </tr></thead>
                <tbody>
                  {[...students].sort((a, b) => b.daysPresent - a.daysPresent).map(s => (
                    <tr key={s._id} className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">{s.name.charAt(0)}</div>
                          <div><p className="text-sm font-bold text-white">{s.name}</p><p className="text-[10px] text-slate-400 font-mono">{s.rollNumber}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{s.isActive ? 'Active' : 'Offline'}</span></td>
                      <td className="py-3 px-4 text-center font-bold text-white">{s.daysPresent}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">{formatTime(s.totalSeconds)}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">{s.avgGrade}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      // ═══ TASKS ═══════════════════════════════════════════
      case 'tasks': return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Task Monitoring ({tasks.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map(task => {
              const taskSubs = submissions.filter(s => s.taskId && s.taskId._id === task._id);
              const gradedSubs = taskSubs.filter(s => s.status === 'graded');
              const batchStudents = students.filter(s => s.batchId && task.batchId && s.batchId.toString() === (task.batchId._id || task.batchId).toString());
              const completionPct = batchStudents.length > 0 ? Math.round((taskSubs.length / batchStudents.length) * 100) : 0;
              return (
                <div key={task._id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm line-clamp-2">{task.title}</h3>
                      <p className="text-[10px] text-slate-400 mt-1">{task.batchId?.batchName || 'Unknown Batch'} · {task.category}</p>
                    </div>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 shrink-0 ml-2">{task.maxMarks}M</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-900 p-2 rounded text-center"><p className="text-sm font-black text-white">{taskSubs.length}</p><p className="text-[9px] text-slate-500">Submitted</p></div>
                    <div className="bg-slate-900 p-2 rounded text-center"><p className="text-sm font-black text-emerald-400">{gradedSubs.length}</p><p className="text-[9px] text-slate-500">Graded</p></div>
                    <div className="bg-slate-900 p-2 rounded text-center"><p className="text-sm font-black text-amber-400">{completionPct}%</p><p className="text-[9px] text-slate-500">Complete</p></div>
                  </div>

                  <div className="w-full bg-slate-700 rounded-full h-1.5 mb-2">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(completionPct, 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                    <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

      // ═══ SUBMISSIONS ═════════════════════════════════════
      case 'submissions': return (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <h2 className="text-lg font-bold text-white">Submission Monitoring</h2>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} /><input type="text" placeholder="Search..." className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 pl-9 pr-3 w-48 focus:outline-none focus:border-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <select className="bg-slate-800 border border-slate-700 text-sm text-white rounded-lg py-2 px-3 focus:outline-none focus:border-indigo-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="graded">Graded</option>
                <option value="submitted">Pending</option>
                <option value="resubmit">Resubmit</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead><tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Task</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Grade</th>
                  <th className="py-3 px-4 font-semibold">Submitted</th>
                  <th className="py-3 px-4 font-semibold">Links</th>
                </tr></thead>
                <tbody>
                  {filteredSubmissions.slice(0, 100).map(sub => (
                    <tr key={sub._id} className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-sm font-bold text-white">{sub.studentId?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{sub.studentId?.rollNumber}</p>
                      </td>
                      <td className="py-3 px-4"><p className="text-sm text-indigo-400 font-medium max-w-[200px] truncate">{sub.taskId?.title}</p><p className="text-[10px] text-slate-500">{sub.taskId?.category}</p></td>
                      <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${sub.status === 'graded' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : sub.status === 'resubmit' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>{sub.status}</span></td>
                      <td className="py-3 px-4 text-center">{sub.grade ? <span className="font-bold text-emerald-400">{sub.grade.marksObtained}/{sub.taskId?.maxMarks}</span> : <span className="text-slate-500">-</span>}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {sub.githubLink && <a href={sub.githubLink} target="_blank" rel="noreferrer" className="p-1 bg-slate-700 text-slate-400 hover:text-white rounded"><GitBranch size={12} /></a>}
                          {sub.liveLink && <a href={sub.liveLink} target="_blank" rel="noreferrer" className="p-1 bg-slate-700 text-slate-400 hover:text-white rounded"><Globe size={12} /></a>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      // ═══ GRADES ══════════════════════════════════════════
      case 'grades': return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Grade Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {(() => {
              const graded = submissions.filter(s => s.grade);
              const marks = graded.map(s => s.grade.marksObtained);
              const highest = marks.length ? Math.max(...marks) : 0;
              const lowest = marks.length ? Math.min(...marks) : 0;
              const avg = marks.length ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
              return [
                { label: 'Total Graded', value: graded.length, color: 'indigo' },
                { label: 'Highest Score', value: highest, color: 'emerald' },
                { label: 'Lowest Score', value: lowest, color: 'rose' },
                { label: 'Average Score', value: avg, color: 'amber' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{s.label}</p>
                  <p className={`text-3xl font-black text-${s.color}-400`}>{s.value}</p>
                </div>
              ));
            })()}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead><tr className="bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Task</th>
                  <th className="py-3 px-4 font-semibold text-center">Score</th>
                  <th className="py-3 px-4 font-semibold">Feedback</th>
                  <th className="py-3 px-4 font-semibold">Reviewer</th>
                </tr></thead>
                <tbody>
                  {submissions.filter(s => s.grade).slice(0, 100).map(sub => (
                    <tr key={sub._id} className="border-t border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-4"><p className="text-sm font-bold text-white">{sub.studentId?.name}</p><p className="text-[10px] text-slate-400 font-mono">{sub.studentId?.rollNumber}</p></td>
                      <td className="py-3 px-4 text-sm text-indigo-400 font-medium max-w-[200px] truncate">{sub.taskId?.title}</td>
                      <td className="py-3 px-4 text-center"><span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">{sub.grade.marksObtained}/{sub.taskId?.maxMarks}</span></td>
                      <td className="py-3 px-4 text-xs text-slate-400 max-w-[250px] truncate italic">"{sub.grade.feedback}"</td>
                      <td className="py-3 px-4 text-xs text-slate-300 font-medium">{sub.grade.reviewedBy?.name || 'Admin'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );

      // ═══ ANALYTICS ═══════════════════════════════════════
      case 'analytics': return (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white">Analytics Center</h2>

          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Students', value: stats.activeStudents, color: 'emerald' },
              { label: 'Tasks Completed', value: stats.completedReviews, color: 'indigo' },
              { label: 'Total Submissions', value: stats.totalSubmissions, color: 'cyan' },
              { label: 'Overall Performance', value: `${stats.avgPerformance}%`, color: 'amber' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">{s.label}</p>
                <p className={`text-3xl font-black text-${s.color}-400`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Student Performance Distribution */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Student Performance Distribution</h3>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: '90-100%', range: [90, 100], color: 'emerald' },
                { label: '70-89%', range: [70, 89], color: 'blue' },
                { label: '50-69%', range: [50, 69], color: 'amber' },
                { label: '30-49%', range: [30, 49], color: 'orange' },
                { label: '0-29%', range: [0, 29], color: 'rose' },
              ].map((tier, i) => {
                const count = students.filter(s => s.avgGrade >= tier.range[0] && s.avgGrade <= tier.range[1]).length;
                const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
                return (
                  <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-black text-${tier.color}-400`}>{count}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{tier.label}</p>
                    <div className="w-full bg-slate-700 rounded-full h-1 mt-2"><div className={`bg-${tier.color}-500 h-1 rounded-full`} style={{ width: `${pct}%` }}></div></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch Comparison */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Batch-wise Analytics</h3>
            <div className="space-y-3">
              {batches.map(batch => (
                <div key={batch._id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">{batch.batchName?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{batch.batchName}</p>
                    <div className="flex gap-4 mt-1 text-[10px] text-slate-400">
                      <span>{batch.studentCount} students</span>
                      <span>{batch.taskCount} tasks</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 shrink-0">
                    <div className="text-center"><p className="text-sm font-bold text-emerald-400">{batch.avgAttendanceDays}d</p><p className="text-[9px] text-slate-500">Attend.</p></div>
                    <div className="text-center"><p className="text-sm font-bold text-amber-400">{batch.avgGrade}%</p><p className="text-[9px] text-slate-500">Grade</p></div>
                    <div className="text-center"><p className="text-sm font-bold text-indigo-400">{batch.submissionCount}</p><p className="text-[9px] text-slate-500">Subs</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      // ═══ ACTIVITY LOGS ═══════════════════════════════════
      case 'logs': return (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Activity Logs</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className="space-y-1">
              {activityTimeline.length === 0 ? <p className="text-slate-500 text-center py-12">No activity logs for today.</p> :
                activityTimeline.map((event, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/10 px-3 rounded-lg transition-colors">
                    <div className="text-xs font-mono text-slate-400 w-16 shrink-0">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      event.type === 'check-in' ? 'bg-emerald-500/20 text-emerald-400' :
                      event.type === 'check-out' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {event.type === 'check-in' ? <UserCheck size={14} /> : event.type === 'check-out' ? <UserX size={14} /> : <FileText size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{event.description}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{event.rollNumber}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      event.type === 'check-in' ? 'bg-emerald-500/10 text-emerald-400' :
                      event.type === 'check-out' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>{event.type.replace('-', ' ')}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      );

      case 'mockDrives': return renderMockDrivesModule();

      default: return <p className="text-slate-500">Module not found.</p>;
    }
  };

  // ─── MAIN LAYOUT ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 border-r border-slate-700 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center"><ShieldCheck size={18} /></div>
            <div>
              <p className="font-bold text-white text-sm">Monitoring Center</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Read-Only Access</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActiveModule(item.id); setSidebarOpen(false); setSearchTerm(''); setStatusFilter(''); setBatchFilter(''); setMockBatchFilter(''); setMockDriveFilter(''); setMockStatusFilter(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeModule === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
              <item.icon size={16} />{item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Connected · {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl"><Layout size={16} /></button>
            <h1 className="text-lg font-bold text-white capitalize">{SIDEBAR_ITEMS.find(i => i.id === activeModule)?.label || 'Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>{new Date().toLocaleString()}
            </div>
            <button onClick={fetchData} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-colors"><RefreshCw size={16} /></button>
          </div>
        </header>

        {/* Module Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {renderModule()}
        </div>
      </main>

      {/* ═══ STUDENT PROFILE MODAL ═══════════════════════════ */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-colors z-10"><XCircle size={22} /></button>

            {detailsLoading ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-400"><Loader2 size={36} className="animate-spin text-indigo-500 mb-4" /><p className="text-sm">Loading Profile...</p></div>
            ) : studentDetails ? (
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-800 pb-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden shrink-0">
                    {studentDetails.profile.profileImage && studentDetails.profile.profileImage !== 'default.jpg' ? (
                      <img src={studentDetails.profile.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-3xl">{studentDetails.profile.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-2xl font-black text-white flex items-center justify-center sm:justify-start gap-2 mb-1">{studentDetails.profile.name} <CheckCircle className="text-emerald-500" size={20} /></h2>
                    <p className="text-slate-400 font-mono mb-3">{selectedStudent}</p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">{formatTime(studentDetails.attendance.totalSecondsLogged)} Logged</span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">{studentDetails.attendance.daysPresent} Days Present</span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">{studentDetails.tasks.length} Tasks Graded</span>
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">{studentDetails.mockDrives ? studentDetails.mockDrives.length : 0} Mock Drives</span>
                      <span className="px-3 py-1 bg-slate-800 text-orange-400 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1">
                        <Flame size={12} fill="currentColor" className="text-orange-500 animate-pulse" />
                        {studentDetails.profile.leetcodeStreak || 0}d Streak ({studentDetails.profile.totalLeetcodeSubmissions || 0} Solved)
                      </span>
                    </div>

                    {/* Contact & Links */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {studentDetails.profile.email && <span className="text-xs text-slate-400">{studentDetails.profile.email}</span>}
                      {studentDetails.profile.phone && <span className="text-xs text-slate-400">· {studentDetails.profile.phone}</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {studentDetails.profile.github && <a href={studentDetails.profile.github} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-white hover:text-black text-slate-400 rounded-lg transition-colors"><GitBranch size={14} /></a>}
                      {studentDetails.profile.linkedin && <a href={studentDetails.profile.linkedin} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-[#0a66c2] hover:text-white text-slate-400 rounded-lg transition-colors"><Globe size={14} /></a>}
                      {studentDetails.profile.leetcode && <a href={studentDetails.profile.leetcode} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-[#ffa116] hover:text-white text-slate-400 rounded-lg transition-colors"><Code size={14} /></a>}
                      {studentDetails.profile.hackerrank && <a href={studentDetails.profile.hackerrank} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 hover:bg-[#2ec866] hover:text-white text-slate-400 rounded-lg transition-colors"><Terminal size={14} /></a>}
                    </div>
                  </div>
                </div>

                {/* Tasks, Quizzes, and Mock Drives */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col h-[350px]">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ClipboardList className="text-indigo-400" size={16} /> Graded Tasks ({studentDetails.tasks.length})</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {studentDetails.tasks.length === 0 ? <p className="text-slate-500 text-sm text-center mt-8">No graded tasks.</p> :
                        studentDetails.tasks.map((t, i) => (
                          <div key={i} className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-white text-sm line-clamp-1">{t.taskTitle}</h4>
                              <span className="shrink-0 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30 ml-2">{t.marksObtained}/{t.maxMarks}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic line-clamp-1">"{t.feedback}"</p>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col h-[350px]">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Briefcase className="text-purple-400" size={16} /> Mock Drives ({studentDetails.mockDrives ? studentDetails.mockDrives.length : 0})</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                      {!studentDetails.mockDrives || studentDetails.mockDrives.length === 0 ? <p className="text-slate-500 text-sm text-center mt-8">No mock drives.</p> :
                        studentDetails.mockDrives.map((m, i) => (
                          <div key={i} className="bg-slate-900 border border-slate-700 p-3 rounded-xl">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-white text-sm line-clamp-1">{m.mockDriveId?.title || 'Mock Drive'}</h4>
                              <span className="shrink-0 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/30 ml-2">{m.totalMarks} Marks</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-400 mt-1.5 border-t border-slate-800/80 pt-1.5">
                              <div>MCQ: <span className="text-white font-semibold">{m.mcq}</span></div>
                              <div>Coding: <span className="text-white font-semibold">{m.coding}</span></div>
                              <div>Tech HR: <span className="text-white font-semibold">{m.techHr}</span></div>
                              <div>HR: <span className="text-white font-semibold">{m.hr}</span></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2 border-t border-slate-800/80 pt-1.5">
                              <span>Pct: {m.percentage}%</span>
                              <span className={`font-semibold ${m.grade === 'Pass' ? 'text-emerald-400' : 'text-rose-400'}`}>{m.grade}</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">Failed to load student details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Verification;
