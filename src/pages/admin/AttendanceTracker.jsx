import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Loader from '../../components/Loader';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Check, Clock, X, XCircle, Filter, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AttendanceTracker = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  
  // Row Filters (Top bar)
  const [filterName, setFilterName] = useState('');
  const [filterRoll, setFilterRoll] = useState('');

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const fetchBatches = async () => {
    try {
      let batchList = [];
      if (user?.role === 'admin') {
        const res = await axios.get('/batches');
        batchList = res.data;
      } else {
        const res = await axios.get('/enrollments/my');
        batchList = res.data.map(e => e.batchId).filter(b => b !== null);
      }
      setBatches(batchList);
      if (batchList.length > 0) {
        setSelectedBatch(batchList[0]._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch batches', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBatches();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        axios.get(`/tasks/tracker/${selectedBatch}`), // Fetch students using the tracker endpoint
        axios.get(`/attendance/summary?batchId=${selectedBatch}`)
      ]);
      
      const allStudents = studentsRes.data.students || [];
      // Students should only see their own row
      if (user?.role === 'student') {
        setStudents(allStudents.filter(s => s._id === user._id));
      } else {
        setStudents(allStudents);
      }
      setAttendanceData(attendanceRes.data || []);
    } catch (error) {
      console.error('Failed to fetch attendance tracker data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    setFilterName('');
    setFilterRoll('');
  }, [selectedBatch]);

  // Pre-calculate attendance lookup map for fast O(1) rendering
  const attendanceMap = useMemo(() => {
    const map = {};
    attendanceData.forEach(record => {
      if (record.studentId && record.date) {
        const studentId = record.studentId.toString();
        if (!map[studentId]) {
          map[studentId] = {};
        }
        map[studentId][record.date] = record;
      }
    });
    return map;
  }, [attendanceData]);

  // Helper to determine cell attendance status
  const getCellAttendanceStatus = (studentId, dateStr) => {
    const record = attendanceMap[studentId]?.[dateStr];
    if (record) {
      if ((record.isLeave || record.status === 'Leave') && (record.leaveHours || 0) === 0) {
        return 'Leave';
      }
      const hours = (record.totalSeconds || 0) / 3600;
      const minRequired = 8 - (record.leaveHours || 0);
      if (hours >= minRequired && hours <= 10) {
        return 'Present';
      } else if (hours > 10) {
        return 'Invalid';
      } else if (record.isActive) {
        return 'In Progress';
      }
    }
    return 'Absent';
  };

  // Today's date string in YYYY-MM-DD format (to exclude from % calc) using local timezone
  const todayStr = useMemo(() => {
    return new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  }, []);

  // Determine all unique attendance dates (excludes future dates to prevent grid glitches)
  const uniqueAttendanceDates = useMemo(() => {
    const datesSet = new Set();
    const currentBatch = batches.find(b => b._id === selectedBatch);
    const batchStartStr = currentBatch?.startDate 
      ? new Date(currentBatch.startDate).toISOString().split('T')[0] 
      : null;

    attendanceData.forEach(log => {
      if (log.date && log.date <= todayStr) {
        if (!batchStartStr || log.date >= batchStartStr) {
          datesSet.add(log.date);
        }
      }
    });
    return Array.from(datesSet).sort(); // Sort in ascending order
  }, [attendanceData, todayStr, batches, selectedBatch]);

  // Overall Attendance % calculation (excludes today)
  const getAttendanceOverallPercentage = (studentId) => {
    const pastDates = uniqueAttendanceDates.filter(d => d !== todayStr);
    if (pastDates.length === 0) return 0;
    
    let presentCount = 0;
    let leaveCount = 0;
    
    pastDates.forEach(date => {
      const status = getCellAttendanceStatus(studentId, date);
      if (status === 'Present') {
        presentCount++;
      } else if (status === 'Leave') {
        leaveCount++;
      }
    });
    
    const denominator = pastDates.length - leaveCount;
    if (denominator > 0) {
      return Math.round((presentCount / denominator) * 100);
    } else if (pastDates.length > 0) {
      return Math.round((presentCount / pastDates.length) * 100);
    }
    return 0;
  };

  // Apply row filters and sorting
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Filter
    result = result.filter(student => {
      if (filterName && !student.name.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      if (filterRoll && !student.rollNumber.toLowerCase().includes(filterRoll.toLowerCase())) {
        return false;
      }
      return true;
    });

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'overallPercentage') {
          aVal = getAttendanceOverallPercentage(a._id);
          bVal = getAttendanceOverallPercentage(b._id);
        } else {
          aVal = aVal || '';
          bVal = bVal || '';
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [students, filterName, filterRoll, sortConfig, attendanceData]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const clearAllFilters = () => {
    setFilterName('');
    setFilterRoll('');
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-slate-400 opacity-50 hover:opacity-100 transition-opacity" />;
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-indigo-500" />;
    return <ArrowDown size={14} className="text-indigo-500" />;
  };

  if (loading && !selectedBatch) return <SkeletonLoader type="table" />;

  const isStudent = user?.role === 'student';

  // Student-specific stats (excludes today from % calculation)
  const studentStats = isStudent && students.length > 0 ? (() => {
    const sid = students[0]._id;
    let present = 0, absent = 0, leave = 0, inProg = 0, invalid = 0;
    const pastDates = uniqueAttendanceDates.filter(d => d !== todayStr);
    pastDates.forEach(date => {
      const status = getCellAttendanceStatus(sid, date);
      if (status === 'Present') present++;
      else if (status === 'Leave') leave++;
      else if (status === 'In Progress') inProg++;
      else if (status === 'Invalid') invalid++;
      else absent++;
    });
    // Today's status is tracked separately for display
    const todayStatus = uniqueAttendanceDates.includes(todayStr) ? getCellAttendanceStatus(sid, todayStr) : null;
    const total = uniqueAttendanceDates.length;
    const denom = pastDates.length - leave;
    const pct = denom > 0 ? Math.round((present / denom) * 100) : 0;
    return { present, absent, leave, inProg, invalid, total, pct, todayStatus };
  })() : null;

  // --- STUDENT VIEW ---
  if (isStudent) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">My Attendance</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Track your daily attendance across batches</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              className="input-field min-w-[160px] font-medium py-2 px-3 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
            </select>
            <button
              onClick={fetchAttendanceData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading && selectedBatch ? (
          <div className="p-12"><Loader /></div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">No attendance data found for this batch.</div>
        ) : (
          <>
            {/* Stats Hero Card */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-700 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border-t border-white/30 shadow-xl shadow-purple-500/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Circular Progress */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray={`${studentStats?.pct || 0} ${100 - (studentStats?.pct || 0)}`} strokeLinecap="round" className="transition-all duration-1000" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white leading-none drop-shadow-lg">{studentStats?.pct || 0}%</span>
                      <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mt-1">Overall</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-purple-200">{studentStats?.total || 0} Total Days Tracked</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="w-9 h-9 mx-auto rounded-xl bg-emerald-500 flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/30">
                      <Check size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <p className="text-2xl font-black leading-none">{studentStats?.present || 0}</p>
                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider mt-1">Present</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="w-9 h-9 mx-auto rounded-xl bg-rose-500 flex items-center justify-center mb-2 shadow-lg shadow-rose-500/30">
                      <X size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <p className="text-2xl font-black leading-none">{studentStats?.absent || 0}</p>
                    <p className="text-[10px] font-bold text-rose-200 uppercase tracking-wider mt-1">Absent</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="w-9 h-9 mx-auto rounded-xl bg-indigo-500 flex items-center justify-center mb-2 shadow-lg shadow-indigo-500/30">
                      <Calendar size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <p className="text-2xl font-black leading-none">{studentStats?.leave || 0}</p>
                    <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mt-1">Leave</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20 hover:bg-white/20 transition-colors">
                    <div className="w-9 h-9 mx-auto rounded-xl bg-amber-400 flex items-center justify-center mb-2 shadow-lg shadow-amber-400/30">
                      <AlertTriangle size={16} className="text-white" strokeWidth={3} />
                    </div>
                    <p className="text-2xl font-black leading-none">{studentStats?.invalid || 0}</p>
                    <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider mt-1">Invalid</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Cards Grid */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Day-by-Day Attendance</h2>
              {uniqueAttendanceDates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-medium bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">No attendance logs found for this batch.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                  {uniqueAttendanceDates.map(date => {
                    const status = getCellAttendanceStatus(students[0]._id, date);
                    let bgColor = 'bg-rose-500/10 border-rose-500/30';
                    let iconBg = 'bg-rose-500';
                    let Icon = X;
                    let label = 'Absent';
                    let textColor = 'text-rose-600 dark:text-rose-400';

                    if (status === 'Present') {
                      bgColor = 'bg-emerald-500/10 border-emerald-500/30';
                      iconBg = 'bg-emerald-500';
                      Icon = Check;
                      label = 'Present';
                      textColor = 'text-emerald-600 dark:text-emerald-400';
                    } else if (status === 'Leave') {
                      bgColor = 'bg-indigo-500/10 border-indigo-500/30';
                      iconBg = 'bg-indigo-500';
                      Icon = Calendar;
                      label = 'Leave';
                      textColor = 'text-indigo-600 dark:text-indigo-400';
                    } else if (status === 'Invalid') {
                      bgColor = 'bg-amber-400/10 border-amber-400/30';
                      iconBg = 'bg-amber-400';
                      Icon = AlertTriangle;
                      label = 'Invalid';
                      textColor = 'text-amber-600 dark:text-amber-400';
                    } else if (status === 'In Progress') {
                      bgColor = 'bg-blue-500/10 border-blue-500/30';
                      iconBg = 'bg-blue-500';
                      Icon = RefreshCw;
                      label = 'In Progress';
                      textColor = 'text-blue-600 dark:text-blue-400';
                    }

                    const d = new Date(date);
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = d.getDate();
                    const month = d.toLocaleDateString('en-US', { month: 'short' });

                    return (
                      <div key={date} className={`${bgColor} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-[1.03] transition-all`}>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{dayName}</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{dayNum}</p>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">{month}</p>
                        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shadow-md mt-1`}>
                          {status === 'In Progress' ? (
                            <Icon size={14} className="text-white animate-spin" />
                          ) : (
                            <Icon size={14} className="text-white" strokeWidth={3} />
                          )}
                        </div>
                        <p className={`text-[10px] font-bold ${textColor} uppercase tracking-wider`}>{label}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // --- ADMIN VIEW (original table) ---
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Batch Attendance Tracker</h1>
          
          <div className="mt-3 flex flex-wrap items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center shadow-sm"><Check size={12} className="text-white" strokeWidth={3} /></div> Present
             </div>
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center shadow-sm"><Calendar size={12} className="text-white" strokeWidth={3} /></div> Approved Leave
             </div>
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center shadow-sm"><RefreshCw size={12} className="text-white animate-spin" strokeWidth={3} /></div> In Progress
             </div>
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-amber-400 rounded flex items-center justify-center shadow-sm"><AlertTriangle size={12} className="text-white" strokeWidth={3} /></div> Invalid (&gt;10h)
             </div>
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-rose-500 rounded flex items-center justify-center shadow-sm"><X size={12} className="text-white" strokeWidth={3} /></div> Absent
             </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-nowrap items-center justify-between gap-3 text-sm">
        
        {/* Scrollable Left Side (Inputs) */}
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto custom-scrollbar flex-1 pb-1 -mb-1">
          {/* Search Inputs */}
          <div className="flex-none flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Search student name..." 
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="input-field w-[180px] py-1.5 px-3 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
            <input 
              type="text" 
              placeholder="Search roll number..." 
              value={filterRoll}
              onChange={(e) => setFilterRoll(e.target.value)}
              className="input-field w-[140px] py-1.5 px-3 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 flex-none hidden lg:block"></div>

          {/* Batch Selector */}
          <div className="flex flex-nowrap items-center gap-2.5 flex-none">
            <select 
              className="input-field min-w-[160px] font-medium py-1.5 px-3 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.batchName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fixed Right Side (Buttons) */}
        <div className="flex items-center gap-2.5 flex-none border-l border-slate-200 dark:border-slate-700 pl-3">
          <button
            onClick={fetchAttendanceData}
            disabled={loading}
            className="px-3 py-1.5 flex items-center gap-1.5 font-medium text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button 
            onClick={clearAllFilters}
            className="px-3 py-1.5 flex items-center gap-1.5 font-medium text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100 dark:border-rose-800/50 whitespace-nowrap"
            title="Reset All Filters"
          >
            <XCircle size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Tracker Table */}
      <div className="glass-panel p-0 overflow-hidden border border-slate-200 dark:border-slate-700/50 rounded-xl relative shadow-sm">
        {loading && selectedBatch ? (
          <div className="p-12"><Loader /></div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No students found in this batch.</div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-50">
                <tr>
                  <th scope="col" className="px-4 py-4 border-b border-r dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-50 min-w-[60px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    S.No
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-[60px] bg-slate-100 dark:bg-slate-800 z-50 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-between">
                      Student Name
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-[260px] bg-slate-100 dark:bg-slate-800 z-50 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group select-none"
                    onClick={() => handleSort('rollNumber')}
                  >
                    <div className="flex items-center justify-between">
                      Roll Number
                      {renderSortIcon('rollNumber')}
                    </div>
                  </th>
                  {uniqueAttendanceDates.map(date => (
                    <th key={date} className="px-4 py-4 border-b border-r dark:border-slate-700 text-center font-bold min-w-[125px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300">
                      {new Date(date).toLocaleDateString('en-GB')}
                    </th>
                  ))}
                  {uniqueAttendanceDates.length === 0 && <th className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">No Logs Found</th>}
                  
                  {/* OVERALL % HEADER */}
                  <th 
                    scope="col" 
                    className="px-6 py-4 border-b border-l dark:border-slate-700 text-center min-w-[130px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold sticky right-0 z-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors group select-none"
                    onClick={() => handleSort('overallPercentage')}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Overall %
                      {renderSortIcon('overallPercentage')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={uniqueAttendanceDates.length === 0 ? 5 : 4 + uniqueAttendanceDates.length} className="px-6 py-8 text-center text-slate-500 bg-white dark:bg-slate-900 font-medium">
                      No students match the current search.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStudents.map((student, idx) => {
                    const rowBgClass = idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800';
                    
                    return (
                      <tr key={student._id} className={`group ${rowBgClass} hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors`}>
                        <td className={`px-4 py-3 border-b border-r dark:border-slate-700 font-bold text-center text-slate-500 dark:text-slate-400 sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors`}>
                          {idx + 1}
                        </td>
                        <td className={`px-6 py-3 border-b border-r dark:border-slate-700 font-medium text-slate-900 dark:text-white sticky left-[60px] z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors`}>
                          {student.name}
                        </td>
                        <td className={`px-6 py-3 border-b border-r dark:border-slate-700 text-slate-600 dark:text-slate-400 sticky left-[260px] z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors`}>
                          {student.rollNumber}
                        </td>
                        {uniqueAttendanceDates.map(date => {
                          const status = getCellAttendanceStatus(student._id, date);
                          let statusColor = 'bg-rose-500';
                          let Icon = X;
                          
                          if (status === 'Present') {
                            statusColor = 'bg-emerald-500';
                            Icon = Check;
                          } else if (status === 'Leave') {
                            statusColor = 'bg-indigo-500';
                            Icon = Calendar;
                          } else if (status === 'Invalid') {
                            statusColor = 'bg-amber-400';
                            Icon = AlertTriangle;
                          } else if (status === 'In Progress') {
                            statusColor = 'bg-blue-500';
                            Icon = RefreshCw;
                          }
                          
                          return (
                            <td key={date} className="px-2 py-3 border-b border-r dark:border-slate-700 text-center relative group z-10">
                              <div className={`w-8 h-8 mx-auto rounded-md shadow-sm flex items-center justify-center ${statusColor} transition-transform group-hover:scale-105`}>
                                {status === 'In Progress' ? (
                                  <Icon size={14} className="text-white animate-spin" />
                                ) : (
                                  <Icon size={14} className="text-white" strokeWidth={3} />
                                )}
                              </div>
                              
                              {/* Tooltip */}
                              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-medium rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                                {status === 'Leave' ? 'Approved Leave' : status === 'Invalid' ? 'Invalid Log (>10h)' : status}
                              </div>
                            </td>
                          );
                        })}
                        {uniqueAttendanceDates.length === 0 && <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500"></td>}
                        
                        {/* OVERALL % CELL */}
                        <td className={`px-6 py-3 border-b border-l dark:border-slate-700 text-center font-bold text-slate-800 dark:text-slate-200 sticky right-0 z-40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass} group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors`}>
                          {getAttendanceOverallPercentage(student._id)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceTracker;
