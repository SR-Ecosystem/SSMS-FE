import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Calendar, Search, Filter, Download, User as UserIcon, CheckCircle, AlertTriangle, XCircle, RefreshCw, LogOut } from 'lucide-react';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader';
import * as XLSX from 'xlsx';

const AttendanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('Day'); // Day, Week, Month, Year
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('All');

  const formatTime = (totalSeconds) => {
    if (!totalSeconds) return '0min';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}hr ${m}min`;
    return `${m}min`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, batchesRes] = await Promise.all([
        axios.get(`/attendance/summary${selectedBatch ? `?batchId=${selectedBatch}` : ''}`),
        axios.get('/batches')
      ]);
      setLogs(logsRes.data);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBatch]);

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Helper to get week number
  const getWeekNumber = (d) => {
    const date = new Date(d.getTime());
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNo}`;
  };

  const getAggregatedData = () => {
    const groupedMap = {};
    
    logs.forEach(log => {
      let groupKey = '';
      const dateObj = new Date(log.date || log.firstCheckIn || Date.now());
      const fallbackDate = dateObj.toISOString().split('T')[0];
      const logDate = log.date || fallbackDate;
      
      if (viewMode === 'Day') {
        groupKey = logDate;
      } else if (viewMode === 'Week') {
        groupKey = getWeekNumber(dateObj);
      } else if (viewMode === 'Month') {
        groupKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      } else if (viewMode === 'Year') {
        groupKey = `${dateObj.getFullYear()}`;
      }

      const key = `${log.studentId}_${groupKey}`;

      if (viewMode === 'Day') {
        if (!groupedMap[key]) {
          groupedMap[key] = { ...log, date: logDate, period: logDate };
        } else {
          groupedMap[key].totalSeconds += (log.totalSeconds || 0);
          if (new Date(log.firstCheckIn) < new Date(groupedMap[key].firstCheckIn)) {
            groupedMap[key].firstCheckIn = log.firstCheckIn;
          }
          if (log.lastCheckOut && new Date(log.lastCheckOut) > new Date(groupedMap[key].lastCheckOut)) {
            groupedMap[key].lastCheckOut = log.lastCheckOut;
          }
          if (log.isActive) {
            groupedMap[key].isActive = true;
            groupedMap[key].lastCheckOut = null;
            groupedMap[key]._id = log._id; // Use active session's ID for checkout
          }
        }
      } else {
        if (!groupedMap[key]) {
          groupedMap[key] = {
            studentId: log.studentId,
            name: log.name,
            email: log.email,
            rollNumber: log.rollNumber,
            period: groupKey,
            totalSeconds: 0,
            daysPresent: 0,
            daysAbsent: 0,
            daysInvalid: 0
          };
        }
        groupedMap[key].totalSeconds += (log.totalSeconds || 0);
        const hours = (log.totalSeconds || 0) / 3600;
        const minRequired = 8 - (log.leaveHours || 0);
        if (hours >= minRequired && hours <= 10) groupedMap[key].daysPresent += 1;
        else if (hours > 10) groupedMap[key].daysInvalid += 1;
        else groupedMap[key].daysAbsent += 1;
      }
    });

    Object.values(groupedMap).forEach(day => {
      if (viewMode === 'Day') {
        if (day.status === 'Leave' || day.isLeave) {
          day.status = 'Leave';
          return;
        }
        const hours = (day.totalSeconds || 0) / 3600;
        const minRequired = 8 - (day.leaveHours || 0);
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (hours >= minRequired && hours <= 10) day.status = 'Present';
        else if (hours > 10) day.status = 'Invalid';
        else if (day.isActive || day.date === todayStr) day.status = 'In Progress';
        else day.status = 'Absent';
      }
    });

    return Object.values(groupedMap).sort((a, b) => b.period.localeCompare(a.period));
  };

  const aggregatedLogs = getAggregatedData();

  const filteredLogs = aggregatedLogs.filter(log => {
    const searchMatch = (log.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (log.email || '').toLowerCase().includes(searchTerm.toLowerCase());
                        
    if (viewMode === 'Day') {
      const logDate = log.date || (log.firstCheckIn ? new Date(log.firstCheckIn).toISOString().split('T')[0] : '');
      const dateMatch = !selectedDate || logDate === selectedDate;
      
      let statusMatch = true;
      if (statusFilter === 'Active') statusMatch = log.isActive === true;
      if (statusFilter === 'Inactive') statusMatch = !log.isActive;
      
      return searchMatch && dateMatch && statusMatch;
    }
    return searchMatch;
  });

  const handleExport = () => {
    const dataToExport = filteredLogs.map(log => {
      if (viewMode === 'Day') {
        return {
          'Student Name': log.name,
          'Email': log.email,
          'Date': log.date,
          'First Check-In': log.firstCheckIn ? new Date(log.firstCheckIn).toLocaleTimeString() : 'N/A',
          'Last Check-Out': log.isActive ? 'Active Now' : (log.lastCheckOut ? new Date(log.lastCheckOut).toLocaleTimeString() : 'N/A'),
          'Total Hours': (log.totalSeconds / 3600).toFixed(2),
          'Status': log.status
        };
      } else {
        return {
          'Student Name': log.name,
          'Email': log.email,
          'Period': log.period,
          'Total Hours': (log.totalSeconds / 3600).toFixed(2),
          'Days Present': log.daysPresent,
          'Days Invalid (>10h)': log.daysInvalid,
          'Days Absent/Partial': log.daysAbsent
        };
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_${viewMode}_View.xlsx`);
  };

  const renderStatusBadge = (status) => {
    if (status === 'Present') return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle size={14}/> Present</span>;
    if (status === 'Invalid') return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold" title="> 10 hours (Left System On)"><AlertTriangle size={14}/> Invalid (&gt;10h)</span>;
    if (status === 'Leave') return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold"><Calendar size={14}/> Approved Leave</span>;
    if (status === 'In Progress') return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold"><Loader2 className="animate-spin" size={14}/> In Progress</span>;
    return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold"><XCircle size={14}/> Absent/Partial</span>;
  };

  const handleCheckout = async (logId, studentName) => {
    if (!logId) return;
    try {
      const result = await Swal.fire({
        title: `Check out ${studentName || 'this student'}?`,
        text: 'This will end their active session.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, check out',
        cancelButtonText: 'Cancel'
      });
      if (!result.isConfirmed) return;
      await axios.put(`/attendance/admin/checkout/${logId}`);
      fetchData();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to checkout student', 'error');
    }
  };

  const handleCheckoutAll = async () => {
    const activeLogs = filteredLogs.filter(log => log.isActive);
    if (activeLogs.length === 0) return;
    
    const studentIds = activeLogs.map(log => log.studentId);
    try {
      const result = await Swal.fire({
        title: 'Check out all active students?',
        text: `This will check out ${activeLogs.length} active students currently visible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, check them out!'
      });
      
      if (result.isConfirmed) {
        setLoading(true);
        await axios.put('/attendance/admin/checkout-all', { studentIds });
        Swal.fire('Success', 'Students checked out successfully', 'success');
        fetchData();
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to checkout all students', 'error');
      setLoading(false);
    }
  };

  const hasActiveLogs = viewMode === 'Day' && filteredLogs.some(log => log.isActive);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-emerald-500" />
            Attendance Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Excel-format aggregated attendance tracking</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search student..." 
            className="input-field pl-9 py-1.5 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="p-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>

        <select 
          className="input-field py-1.5 text-sm w-full sm:w-auto min-w-[140px]"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          <option value="">All Batches</option>
          {batches.map(b => (
            <option key={b._id} value={b._id}>{b.batchName}</option>
          ))}
        </select>

        <select 
          className="input-field py-1.5 text-sm w-full sm:w-auto min-w-[130px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
        >
          <option value="Day">Daily View</option>
          <option value="Week">Weekly View</option>
          <option value="Month">Monthly View</option>
          <option value="Year">Yearly View</option>
        </select>
        
        {viewMode === 'Day' && (
          <>
            <input 
              type="date"
              className="input-field py-1.5 text-sm w-full sm:w-auto font-bold text-slate-700 dark:text-slate-200"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <select 
              className="input-field py-1.5 text-sm w-full sm:w-auto min-w-[130px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Now</option>
              <option value="Inactive">Inactive</option>
            </select>
          </>
        )}

        <button onClick={handleExport} className="btn-primary flex items-center gap-2 py-1.5 text-sm shrink-0">
          <Download size={14} /> Export
        </button>
        {hasActiveLogs && (
          <button 
            onClick={handleCheckoutAll} 
            className="px-3 py-1.5 flex items-center gap-1.5 text-sm font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800/50 rounded-lg hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
            title="Checkout all visible active students"
          >
            <LogOut size={14} /> Checkout All
          </button>
        )}
      </div>

      <div className="glass-panel overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <Calendar className="w-12 h-12 mb-3 opacity-50" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No Data Found</h3>
            <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden p-4">
              {filteredLogs.map((log, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">
                        {(log.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{log.name || 'Unknown Student'}</p>
                        <p className="text-xs text-slate-500">{log.email || 'No email'}</p>
                      </div>
                    </div>
                    {viewMode === 'Day' && (
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${
                        log.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                        log.status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                        log.status === 'Leave' ? 'bg-indigo-100 text-indigo-700' :
                        log.status === 'Invalid' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {log.status}
                      </span>
                    )}
                  </div>
                  
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2 flex justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <span className="text-slate-500">{viewMode === 'Day' ? 'Date' : 'Period'}:</span>
                      <span className="font-bold">{viewMode === 'Day' ? log.date : log.period}</span>
                    </div>
                    
                    {viewMode === 'Day' ? (
                      <>
                        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded flex flex-col">
                          <span className="text-xs text-slate-500">First In</span>
                          <span className="font-medium">{log.firstCheckIn ? new Date(log.firstCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded flex flex-col">
                          <span className="text-xs text-slate-500">Last Out</span>
                          {log.isActive ? (
                            <span className="text-emerald-500 font-bold flex items-center justify-between gap-1 w-full">
                              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active</span>
                              <button 
                                onClick={() => handleCheckout(log._id, log.name)}
                                className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 rounded transition-colors bg-rose-50 dark:bg-rose-900/20"
                                title="Force Checkout"
                              >
                                <LogOut size={14} />
                              </button>
                            </span>
                          ) : (
                            <span className="font-medium">{log.lastCheckOut ? new Date(log.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                          )}
                        </div>
                        <div className="col-span-2 bg-slate-50 dark:bg-slate-900 p-2 rounded flex justify-between items-center">
                          <span className="text-xs text-slate-500">Total Logged Time</span>
                          <span className="font-bold text-lg text-emerald-600">{formatTime(log.totalSeconds)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="col-span-2 bg-slate-50 dark:bg-slate-900 p-2 rounded flex justify-between items-center">
                          <span className="text-xs text-slate-500">Total Logged Time</span>
                          <span className="font-bold text-lg text-emerald-600">{formatTime(log.totalSeconds)}</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                          <span className="text-xs">Days Present</span>
                          <span className="font-bold">{log.daysPresent}</span>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/20 p-2 rounded flex justify-between items-center text-rose-700 dark:text-rose-400">
                          <span className="text-xs">Absent/Partial</span>
                          <span className="font-bold">{log.daysAbsent}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-semibold w-16">S.No.</th>
                    <th className="p-4 font-semibold">Student Name</th>
                    <th className="p-4 font-semibold">{viewMode === 'Day' ? 'Date' : 'Period'}</th>
                    {viewMode === 'Day' && (
                      <>
                        <th className="p-4 font-semibold">First Check-In</th>
                        <th className="p-4 font-semibold">Last Check-Out</th>
                      </>
                    )}
                    <th className="p-4 font-semibold">Total Logged Time</th>
                    {viewMode === 'Day' ? (
                      <th className="p-4 font-semibold">Daily Status</th>
                    ) : (
                      <>
                        <th className="p-4 font-semibold text-emerald-600">Days Present</th>
                        <th className="p-4 font-semibold text-amber-600">Invalid (&gt;10h)</th>
                        <th className="p-4 font-semibold text-rose-600">Absent/Partial</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredLogs.map((log, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                            {(log.name || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{log.name || 'Unknown Student'}</p>
                            <p className="text-[10px] text-slate-500">{log.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                        {viewMode === 'Day' ? log.date : log.period}
                      </td>
                      {viewMode === 'Day' && (
                        <>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {log.firstCheckIn ? new Date(log.firstCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {log.isActive ? (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">Active Now</span>
                                <button 
                                  onClick={() => handleCheckout(log._id, log.name)}
                                  className="p-1 ml-1 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 rounded transition-colors"
                                  title="Force Checkout"
                                >
                                  <LogOut size={14} />
                                </button>
                              </div>
                            ) : (
                              log.lastCheckOut ? new Date(log.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
                            )}
                          </td>
                        </>
                      )}
                      <td className="p-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatTime(log.totalSeconds)}</span>
                      </td>
                      {viewMode === 'Day' ? (
                        <td className="p-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-wider ${
                            log.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                            log.status === 'Absent' ? 'bg-rose-100 text-rose-700' :
                            log.status === 'Leave' ? 'bg-indigo-100 text-indigo-700' :
                            log.status === 'Invalid' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      ) : (
                        <>
                          <td className="p-4 font-bold text-emerald-600">{log.daysPresent}</td>
                          <td className="p-4 font-bold text-amber-600">{log.daysInvalid}</td>
                          <td className="p-4 font-bold text-rose-600">{log.daysAbsent}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceLogs;
