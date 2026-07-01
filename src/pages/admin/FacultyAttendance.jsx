import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Users, Clock, Search, RefreshCw, ArrowUpDown } from 'lucide-react';
import Loader from '../../components/Loader';

const FacultyAttendance = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [totalClassStrength, setTotalClassStrength] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters and Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc'); // name-asc, name-desc, id-asc, id-desc
  const [presenceFilter, setPresenceFilter] = useState('all'); // all, present, absent
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/public/batches');
      setBatches(res.data);
      if (res.data.length > 0 && !selectedBatch) {
        setSelectedBatch(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const fetchAttendance = async () => {
    if (!selectedBatch) return;
    try {
      setRefreshing(true);
      // Fetch summary list with target date
      const res = await axios.get(`/public/attendance/summary?batchId=${selectedBatch}&date=${selectedDate}`);
      
      const { totalStrength, logs } = res.data;
      const allStudents = logs.filter(log => log.date === selectedDate);
      
      setAttendance(allStudents);
      setTotalClassStrength(allStudents.length);
    } catch (err) {
      console.error('Error fetching attendance summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchAttendance();
    }
  }, [selectedBatch, selectedDate]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter and sort logs
  const filteredLogs = attendance
    .filter(log => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = log.name.toLowerCase().includes(searchLower) ||
        (log.rollNumber && log.rollNumber.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      if (presenceFilter === 'present') {
        return log.isActive === true;
      }
      if (presenceFilter === 'absent') {
        return log.isCheckedIn === false && log.isLeave === false;
      }
      if (presenceFilter === 'permission') {
        return log.isLeave === true && log.isActive === false && log.status !== 'Present';
      }
      if (presenceFilter === 'wfh') {
        return log.accessType === 'wfh';
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'id-asc') {
        const rollA = a.rollNumber || '';
        const rollB = b.rollNumber || '';
        return rollA.localeCompare(rollB, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (sortBy === 'id-desc') {
        const rollA = a.rollNumber || '';
        const rollB = b.rollNumber || '';
        return rollB.localeCompare(rollA, undefined, { numeric: true, sensitivity: 'base' });
      }
      return 0;
    });

  // Calculate statistics
  const activeNow = attendance.filter(log => log.isActive).length;
  const totalOnLeave = attendance.filter(log => log.isLeave && !log.isActive && log.status !== 'Present').length;
  const totalWfh = attendance.filter(log => log.accessType === 'wfh').length;
  const totalAbsent = attendance.filter(log => !log.isActive && (!log.isLeave || log.status === 'Present') && (!log.isCheckedIn || log.status === 'Absent')).length;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 md:p-8 space-y-6 text-slate-800 light-theme-override">
      <style>{`
        /* Keep page light theme-only as requested */
        .light-theme-override {
          background-color: #f8fafc !important;
          color: #1e293b !important;
        }
        .light-theme-override h1, 
        .light-theme-override h2, 
        .light-theme-override h3, 
        .light-theme-override p, 
        .light-theme-override span, 
        .light-theme-override label {
          color: #1e293b !important;
        }
        .light-theme-override .text-muted {
          color: #64748b !important;
        }
        .light-theme-override .glass-card {
          background-color: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02) !important;
        }
        .light-theme-override input, 
        .light-theme-override select {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #1e293b !important;
        }
        .light-theme-override input::placeholder {
          color: #94a3b8 !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Classroom & Remote Attendance</h1>
          <p className="text-muted text-sm font-medium mt-1">Faculty real-time dashboard of student attendance status (On-Site & WFH)</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            className="flex-1 sm:flex-initial min-w-[130px] px-3 py-2 text-xs sm:text-sm font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">Choose Batch...</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>

          <button
            onClick={fetchAttendance}
            disabled={refreshing || !selectedBatch}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
            title="Refresh Attendance List"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <div className="glass-card p-3 sm:p-5 rounded-2xl flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">Strength</p>
            <h3 className="text-sm sm:text-2xl font-black mt-0.5">{totalClassStrength} <span className="hidden md:inline text-xs font-medium text-muted">students</span></h3>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5 rounded-2xl flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl items-center justify-center shrink-0 relative">
            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-ping absolute"></div>
            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full relative"></div>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">Present</p>
            <h3 className="text-sm sm:text-2xl font-black mt-0.5">{activeNow} <span className="hidden md:inline text-xs font-medium text-muted">active</span></h3>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5 rounded-2xl flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-rose-50 text-rose-600 rounded-xl items-center justify-center shrink-0">
            <Users size={24} className="text-rose-500" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">Absent</p>
            <h3 className="text-sm sm:text-2xl font-black mt-0.5">{totalAbsent} <span className="hidden md:inline text-xs font-medium text-muted">students</span></h3>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5 rounded-2xl flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-amber-50 text-amber-600 rounded-xl items-center justify-center shrink-0">
            <Clock size={24} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">Permission</p>
            <h3 className="text-sm sm:text-2xl font-black mt-0.5">{totalOnLeave} <span className="hidden md:inline text-xs font-medium text-muted">students</span></h3>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-5 rounded-2xl flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl items-center justify-center shrink-0">
            <Users size={24} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-muted uppercase tracking-wider">WFH</p>
            <h3 className="text-sm sm:text-2xl font-black mt-0.5">{totalWfh} <span className="hidden md:inline text-xs font-medium text-muted">students</span></h3>
          </div>
        </div>
      </div>

      {/* Search & Sort Panel */}
      <div className="glass-card p-4 rounded-2xl space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search student by name or roll number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter & Sort Controls Row */}
        <div className="flex flex-row items-center gap-2 w-full justify-between">
          {/* Segmented Filter Buttons (Show All, Present, Absent) */}
          <div className="flex flex-1 bg-slate-100 p-1 rounded-xl items-center max-w-[400px] sm:max-w-none">
            <button
              onClick={() => setPresenceFilter('all')}
              className={`flex-1 text-center py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${presenceFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All
            </button>
            <button
              onClick={() => setPresenceFilter('present')}
              className={`flex-1 text-center py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${presenceFilter === 'present' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Present
            </button>
            <button
              onClick={() => setPresenceFilter('absent')}
              className={`flex-1 text-center py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${presenceFilter === 'absent' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Absent
            </button>
            <button
              onClick={() => setPresenceFilter('permission')}
              className={`flex-1 text-center py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${presenceFilter === 'permission' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Permission
            </button>
            <button
              onClick={() => setPresenceFilter('wfh')}
              className={`flex-1 text-center py-1.5 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${presenceFilter === 'wfh' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              WFH
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 flex-1 max-w-[160px] sm:max-w-none justify-end">
            <ArrowUpDown size={14} className="text-slate-400 shrink-0 hidden xs:inline" />
            <select
              className="w-full sm:w-[150px] px-2 py-1.5 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm border border-slate-200 bg-white text-slate-800"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="id-asc">ID A-Z</option>
              <option value="id-desc">ID Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="p-12"><Loader /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl">
          <p className="text-muted font-bold text-base">No students found matching current filters.</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Verify that the correct batch is selected and that students have checked in today.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLogs.map(student => (
            <div key={student._id} className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-200 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{student.name}</h3>
                  <p className="text-xs font-semibold text-muted tracking-wide uppercase mt-0.5">{student.rollNumber || 'No ID'}</p>
                </div>
                 <div className="flex items-center gap-1.5">
                  {student.accessType === 'wfh' && (
                    <span className="bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-[9px] font-black text-cyan-600 uppercase tracking-wider shrink-0">
                      WFH
                    </span>
                  )}
                  {student.isActive ? (
                    <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-wider relative">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping absolute"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full relative"></span>
                      Active
                    </span>
                  ) : student.isLeave ? (
                    <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-600 uppercase tracking-wider">
                      Permission
                    </span>
                  ) : !student.isCheckedIn ? (
                    <span className="bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-black text-rose-600 uppercase tracking-wider">
                      Absent
                    </span>
                  ) : (
                    <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Checked Out
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Time Worked</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{formatDuration(student.totalSeconds)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Check-in Status</p>
                  <p className={`text-sm font-black mt-0.5 ${
                    student.isActive 
                      ? 'text-emerald-600' 
                      : (student.isLeave && student.status !== 'Present') 
                        ? 'text-amber-600' 
                        : student.status === 'Present'
                          ? 'text-emerald-600'
                          : student.status === 'Absent' 
                            ? 'text-rose-600' 
                            : 'text-indigo-600'
                  }`}>
                    {student.isActive 
                      ? 'Active' 
                      : (student.isLeave && student.status !== 'Present') 
                        ? 'Permission Leave' 
                        : student.status}
                  </p>
                </div>
              </div>

              {student.isLeave ? (
                <div className="mt-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 flex items-center justify-between text-[11px] text-amber-700">
                  <span className="font-extrabold tracking-wide uppercase">Details:</span>
                  <span className="font-bold text-right">{student.leaveInfo}</span>
                </div>
              ) : (
                <div className="mt-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-muted">
                  <div>
                    <span className="font-medium">In:</span> <span className="font-bold text-slate-700">{formatTime(student.firstCheckIn)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Out:</span> <span className="font-bold text-slate-700">{student.isActive ? 'Active now' : formatTime(student.lastCheckOut)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyAttendance;
