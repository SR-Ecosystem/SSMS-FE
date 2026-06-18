import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, CheckCircle, XCircle, Clock, User as UserIcon, RefreshCw, Search, Filter, RotateCcw, Loader2 } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ id: null, status: null });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leavesRes, batchesRes] = await Promise.all([
        axios.get('/leaves'),
        axios.get('/batches')
      ]);
      setLeaves(leavesRes.data);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Error fetching leave requests data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const result = await Swal.fire({
        title: `Are you sure?`,
        text: `You are about to ${status} this leave request.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, ${status} it!`
      });

      if (result.isConfirmed) {
        setActionLoading({ id, status });
        await axios.put(`/leaves/${id}/status`, { status });
        Swal.fire('Success', `Leave request has been ${status}.`, 'success');
        fetchData();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || `Failed to ${status} leave.`, 'error');
    } finally {
      setActionLoading({ id: null, status: null });
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBatch('');
    setSelectedStatus('all');
  };

  // Filtered leaves
  const filteredLeaves = leaves.filter((leave) => {
    const studentName = leave.studentId?.name || '';
    const studentRoll = leave.studentId?.rollNumber || '';
    const studentEmail = leave.studentId?.email || '';
    const reasonText = leave.reason || '';

    const matchesSearch = 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentRoll.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reasonText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = 
      !selectedBatch || 
      leave.studentId?.batch === selectedBatch || 
      (leave.studentId?.batch?._id === selectedBatch);

    const matchesStatus = 
      selectedStatus === 'all' || 
      leave.status === selectedStatus;

    return matchesSearch && matchesBatch && matchesStatus;
  });

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="text-indigo-500" />
            Leave Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage and approve student leave requests</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search student or reason..."
            className="input-field pl-9 py-1.5 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={fetchData}
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
          className="input-field py-1.5 text-sm w-full sm:w-auto min-w-[140px]"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button 
          onClick={handleResetFilters}
          className="px-3 py-1.5 flex items-center justify-center gap-1.5 font-medium text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100 dark:border-rose-800/50 whitespace-nowrap cursor-pointer w-full sm:w-auto sm:ml-auto"
          title="Reset Filters"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredLeaves.length === 0 ? (
          <div className="glass-panel p-12 text-center text-slate-500 dark:text-slate-400 col-span-full">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200">No requests found</p>
            <p className="text-sm mt-1 font-medium">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          filteredLeaves.map((leave) => (
            <div key={leave._id} className="glass-panel p-6 card-hover relative overflow-hidden flex flex-col group">
              {/* Accent Line */}
              <div className={`absolute top-0 left-0 w-full h-1 ${leave.status === 'pending' ? 'bg-amber-500' : leave.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              
              <div className="flex flex-col h-full gap-6">
                {/* Header: User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                    <UserIcon size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[17px] text-slate-800 dark:text-white leading-tight truncate">{leave.studentId?.name || 'Unknown Student'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{leave.studentId?.rollNumber} • {leave.studentId?.email}</p>
                  </div>
                  
                  {/* Status Badge (if not pending) positioned top right */}
                  {leave.status !== 'pending' && (
                    <div className={`ml-auto px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 text-xs shadow-sm border ${
                      leave.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400' 
                        : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800/50 dark:text-rose-400'
                    }`}>
                      {leave.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {leave.status.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content: Date and Reason */}
                <div className="flex flex-col flex-1">
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                      <Calendar size={14} /> 
                      {leave.leaveType === 'multiple_days' ? (
                        <>Req. Date: {leave.startDate} to {leave.endDate}</>
                      ) : leave.leaveType === 'hours' ? (
                        <>Req. Date: {leave.startDate} ({leave.startTime} - {leave.endTime})</>
                      ) : (
                        <>Req. Date: {leave.startDate || leave.date}</>
                      )}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 relative flex-1">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-300 dark:bg-slate-700 rounded-l-xl"></div>
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-2">Reason for leave</span>
                    <p className="text-slate-700 dark:text-slate-300 text-sm ml-2 leading-relaxed">
                      {leave.reason}
                    </p>
                  </div>
                </div>

                {/* Footer: Actions and Applied Date */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <Clock size={12} /> Applied: {new Date(leave.createdAt).toLocaleDateString()}
                  </span>
                  
                  {leave.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(leave._id, 'rejected')}
                        disabled={actionLoading.id === leave._id}
                        className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-sm shadow-sm disabled:opacity-50"
                      >
                        {actionLoading.id === leave._id && actionLoading.status === 'rejected' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Reject
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(leave._id, 'approved')}
                        disabled={actionLoading.id === leave._id}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 cursor-pointer text-sm disabled:opacity-50"
                      >
                        {actionLoading.id === leave._id && actionLoading.status === 'approved' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Approve
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;
