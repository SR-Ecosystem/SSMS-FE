import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Calendar, Search, Filter, Download, User as UserIcon, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
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
        if (log.status === 'Present') groupedMap[key].daysPresent += 1;
        else if (log.status === 'Absent') groupedMap[key].daysAbsent += 1;
        else if (log.status === 'Invalid') groupedMap[key].daysInvalid += 1;
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
          'Days Invalid (>12h)': log.daysInvalid,
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
    if (status === 'Invalid') return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold" title="> 12 hours (Left System On)"><AlertTriangle size={14}/> Invalid (&gt;12h)</span>;
    if (status === 'Leave') return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold"><Calendar size={14}/> Approved Leave</span>;
    if (status === 'In Progress') return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold"><Loader2 className="animate-spin" size={14}/> In Progress</span>;
    return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold"><XCircle size={14}/> Absent/Partial</span>;
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-emerald-500" />
            Attendance Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">Excel-format aggregated attendance tracking</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search student..." 
              className="input-field pl-9 py-2 text-sm w-full md:w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="input-field py-2 text-sm w-full sm:w-auto max-w-[150px]"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>
          <select 
            className="input-field py-2 text-sm font-bold text-emerald-700 bg-emerald-50 border-emerald-200 w-full sm:w-auto min-w-[140px]"
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
                className="input-field py-2 text-sm w-full sm:w-auto font-bold text-slate-700"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <select 
                className="input-field py-2 text-sm w-full sm:w-auto font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Now</option>
                <option value="Inactive">Inactive</option>
              </select>
            </>
          )}
          <button onClick={handleExport} className="btn-primary flex items-center gap-2 py-2">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <Calendar className="w-12 h-12 mb-3 opacity-50" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No Data Found</h3>
            <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500">
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
                      <th className="p-4 font-semibold text-amber-600">Invalid (&gt;12h)</th>
                      <th className="p-4 font-semibold text-rose-600">Absent/Partial</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
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
                            <span className="text-emerald-500 font-bold animate-pulse text-xs">Active</span>
                          ) : (
                            log.lastCheckOut ? new Date(log.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
                          )}
                        </td>
                      </>
                    )}
                    <td className="p-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {formatDuration(log.totalSeconds)}
                    </td>
                    {viewMode === 'Day' ? (
                      <td className="p-4">
                        {renderStatusBadge(log.status)}
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
        )}
      </div>
    </div>
  );
};

export default AttendanceLogs;
