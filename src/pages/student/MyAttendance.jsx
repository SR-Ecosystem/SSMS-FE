import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Calendar, Download, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import * as XLSX from 'xlsx';

const MyAttendance = () => {
  const { themeColor, activeTheme } = useOutletContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('Day'); // Day, Week, Month, Year

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get('/attendance/my-summary');
      setLogs(data);
    } catch (error) {
      console.error('Error fetching my attendance summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

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
    // 1. Group ALL logs by Day first
    const dailyMap = {};
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    logs.forEach(log => {
      const dateObj = new Date(log.date || log.firstCheckIn || Date.now());
      const fallbackDate = dateObj.toISOString().split('T')[0];
      const logDate = log.date || fallbackDate;
      const dailyKey = logDate;

      if (!dailyMap[dailyKey]) {
        dailyMap[dailyKey] = { ...log, date: logDate };
      } else {
        dailyMap[dailyKey].totalSeconds += (log.totalSeconds || 0);
        if (new Date(log.firstCheckIn) < new Date(dailyMap[dailyKey].firstCheckIn)) {
          dailyMap[dailyKey].firstCheckIn = log.firstCheckIn;
        }
        if (log.lastCheckOut && new Date(log.lastCheckOut) > new Date(dailyMap[dailyKey].lastCheckOut)) {
          dailyMap[dailyKey].lastCheckOut = log.lastCheckOut;
        }
        if (log.isActive) {
          dailyMap[dailyKey].isActive = true;
          dailyMap[dailyKey].lastCheckOut = null;
        }
      }
    });

    // 2. Calculate the finalized status for each DAY
    Object.values(dailyMap).forEach(day => {
      if ((day.status === 'Leave' || day.isLeave) && (day.leaveHours || 0) === 0) {
        day.status = 'Leave';
        return;
      }
      const hours = day.totalSeconds / 3600;
      const minRequired = 8 - (day.leaveHours || 0);
      
      if (hours >= minRequired && hours <= 10) day.status = 'Present';
      else if (hours > 10) day.status = 'Invalid';
      else if (day.isActive) day.status = 'In Progress';
      else day.status = 'Absent';
    });

    // 3. If viewMode === 'Day', return the sorted daily results
    if (viewMode === 'Day') {
      return Object.values(dailyMap).map(d => ({ ...d, period: d.date })).sort((a, b) => b.date.localeCompare(a.date));
    }

    // 4. If viewMode is Week/Month/Year, aggregate the DAILY results
    const groupedMap = {};
    Object.values(dailyMap).forEach(day => {
      let groupKey = '';
      const dateObj = new Date(day.date);
      
      if (viewMode === 'Week') groupKey = getWeekNumber(dateObj);
      else if (viewMode === 'Month') groupKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      else if (viewMode === 'Year') groupKey = `${dateObj.getFullYear()}`;

      const key = groupKey;

      if (!groupedMap[key]) {
        groupedMap[key] = {
          period: groupKey,
          totalSeconds: 0,
          daysPresent: 0,
          daysAbsent: 0,
          daysInvalid: 0
        };
      }

      groupedMap[key].totalSeconds += day.totalSeconds;
      if (day.status === 'Present') groupedMap[key].daysPresent += 1;
      else if (day.status === 'Absent' || day.status === 'Leave') groupedMap[key].daysAbsent += 1;
      else if (day.status === 'Invalid') groupedMap[key].daysInvalid += 1;
    });

    return Object.values(groupedMap).sort((a, b) => b.period.localeCompare(a.period));
  };

  const aggregatedLogs = getAggregatedData();

  const handleExport = () => {
    const dataToExport = aggregatedLogs.map(log => {
      if (viewMode === 'Day') {
        return {
          'Date': log.date,
          'First Check-In': log.firstCheckIn ? new Date(log.firstCheckIn).toLocaleTimeString() : 'N/A',
          'Last Check-Out': log.isActive ? 'Active Now' : (log.lastCheckOut ? new Date(log.lastCheckOut).toLocaleTimeString() : 'N/A'),
          'Total Hours': (log.totalSeconds / 3600).toFixed(2),
          'Status': log.status
        };
      } else {
        return {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "My_Attendance");
    XLSX.writeFile(workbook, `My_Attendance_${viewMode}_View.xlsx`);
  };

  const renderStatusBadge = (status) => {
    if (status === 'Present') return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle size={14}/> Present</span>;
    if (status === 'Invalid') return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-bold" title="> 10 hours (Left System On)"><AlertTriangle size={14}/> Invalid (&gt;10h)</span>;
    if (status === 'Leave') return <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold"><Calendar size={14}/> Approved Leave</span>;
    if (status === 'In Progress') return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold"><Loader2 className="animate-spin" size={14}/> In Progress</span>;
    return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded text-xs font-bold"><XCircle size={14}/> Absent/Partial</span>;
  };

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
            <Calendar className="text-theme-primary drop-shadow-sm" />
            My Attendance Record
          </h1>
          <p className="text-sm text-slate-300 mt-1 drop-shadow-sm">Excel-format aggregated attendance tracking</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="input-field py-2 text-sm font-bold text-white bg-slate-800 border-slate-700 w-full sm:w-auto min-w-[140px] focus:ring-theme-primary focus:border-theme-primary shadow-inner rounded-xl"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="Day">Daily View</option>
            <option value="Week">Weekly View</option>
            <option value="Month">Monthly View</option>
            <option value="Year">Yearly View</option>
          </select>
          <button onClick={handleExport} className="bg-gradient-to-r from-primary-500 to-theme-accent hover:from-primary-600 hover:to-theme-accent text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-theme-primary/30 hover:-translate-y-0.5 active:translate-y-0.5">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center text-sm shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl pointer-events-none -mt-10 -mr-10"></div>
        <div className="flex items-center gap-2 text-theme-primary font-bold bg-primary-500/20 border border-primary-500/30 px-3 py-1.5 rounded-lg shrink-0 shadow-sm relative z-10">
          <CheckCircle size={16} /> Present
        </div>
        <p className="text-primary-100 relative z-10 drop-shadow-sm">
          You must log between <strong>8 hours</strong> and <strong>10 hours</strong> of session time in a single day to be marked as Present.
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-1 rounded-3xl border-t border-white/20 border-b-[3px] border-black/40 shadow-xl shadow-black/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="bg-slate-900/50 rounded-[1.4rem] overflow-hidden backdrop-blur-xl relative z-10">
          {aggregatedLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
              <Calendar className="w-12 h-12 mb-3 opacity-30" />
              <h3 className="font-bold text-white drop-shadow-sm">No Data Found</h3>
              <p className="text-sm mt-1">You don't have any attendance logs yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-800/80 border-b-2 border-black/20 text-xs uppercase tracking-widest text-slate-400">
                    <th className="p-4 font-bold">{viewMode === 'Day' ? 'Date' : 'Period'}</th>
                    {viewMode === 'Day' && (
                      <>
                        <th className="p-4 font-bold">First Check-In</th>
                        <th className="p-4 font-bold">Last Check-Out</th>
                      </>
                    )}
                    <th className="p-4 font-bold">Total Logged Time</th>
                    {viewMode === 'Day' ? (
                      <th className="p-4 font-bold">Daily Status</th>
                    ) : (
                      <>
                        <th className="p-4 font-bold text-theme-primary">Days Present</th>
                        <th className="p-4 font-bold text-amber-400">Invalid (&gt;10h)</th>
                        <th className="p-4 font-bold text-rose-400">Absent/Partial</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {aggregatedLogs.map((log, idx) => (
                    <tr key={idx} className="border-b-[3px] border-black/20 bg-gradient-to-r hover:from-white/10 hover:to-transparent transition-all group">
                      <td className="p-4 font-bold text-white drop-shadow-sm">
                        {viewMode === 'Day' ? log.date : log.period}
                      </td>
                      {viewMode === 'Day' && (
                        <>
                          <td className="p-4 text-slate-300 font-medium">
                            {log.firstCheckIn ? new Date(log.firstCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>
                          <td className="p-4 text-slate-300 font-medium">
                            {log.isActive ? (
                              <span className="text-emerald-400 font-bold animate-pulse text-xs flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Active Now</span>
                            ) : (
                              log.lastCheckOut ? new Date(log.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'
                            )}
                          </td>
                        </>
                      )}
                      <td className="p-4 font-mono font-bold text-primary-100 bg-white/5 group-hover:bg-white/10 rounded-xl m-1 transition-colors">
                        {formatDuration(log.totalSeconds)}
                      </td>
                    {viewMode === 'Day' ? (
                      <td className="p-4">
                        {renderStatusBadge(log.status)}
                      </td>
                    ) : (
                      <>
                        <td className="p-4 font-bold text-theme-primary">{log.daysPresent}</td>
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
    </div>
  );
};

export default MyAttendance;
