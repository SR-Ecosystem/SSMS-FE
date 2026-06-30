import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchLogs = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const { data } = await axios.get('/analytics/activity-logs');
      setLogs(data);
      if (isManual) setCurrentTime(new Date());
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLogTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <SkeletonLoader type="logs" />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Activity Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Real-time trace of portal actions and student check-ins</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-350 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{currentTime.toLocaleString()}</span>
          </div>
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Logs Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8">
        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log) => {
              const isSubmission = log.type === 'SUBMISSION';
              const isCheckIn = log.type === 'CHECK IN';
              
              // Define color style configurations based on action type
              let badgeColor = '';
              let circleBg = '';
              let iconColor = '';
              let iconElement = null;

              if (isSubmission) {
                badgeColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30';
                circleBg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-500';
                iconColor = 'text-blue-500';
                iconElement = <FileText size={15} />;
              } else if (isCheckIn) {
                badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
                circleBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-505';
                iconColor = 'text-emerald-500';
                iconElement = <ArrowLeft size={15} />;
              } else {
                // CHECK OUT
                badgeColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
                circleBg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-500';
                iconColor = 'text-rose-500';
                iconElement = <ArrowRight size={15} />;
              }

              return (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all duration-200"
                >
                  {/* Left Side: Time and details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-16 shrink-0">
                      {formatLogTime(log.timestamp)}
                    </span>
                    
                    {/* Rounded Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${circleBg}`}>
                      {iconElement}
                    </div>

                    {/* Name & Details */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-850 dark:text-slate-200 leading-snug">
                        {log.message}
                      </p>
                      {log.rollNumber && (
                        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-505 mt-0.5 tracking-wider uppercase">
                          {log.rollNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Type Badge */}
                  <div className="shrink-0">
                    <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg text-center ${badgeColor}`}>
                      {log.type}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-450 dark:text-slate-500">
              <p className="text-sm font-semibold">No activity logs recorded today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
