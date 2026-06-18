import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Loader2, Clock, RefreshCw, Search, RotateCcw } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import Swal from 'sweetalert2';

const EnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ id: null, action: null });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [enrollRes, batchesRes] = await Promise.all([
        axios.get('/enrollments/pending'),
        axios.get('/batches')
      ]);
      setRequests(enrollRes.data);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading({ id, action });
    try {
      await axios.put(`/enrollments/${id}/${action}`);
      await fetchRequests();
      
      Swal.fire({
        icon: 'success',
        title: action === 'approve' ? 'Approved!' : 'Rejected',
        text: `The join request has been successfully ${action}d.`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `Failed to ${action} the request. Please try again.`
      });
    } finally {
      setActionLoading({ id: null, action: null });
    }
  };

  const filteredRequests = requests.filter((req) => {
    const studentName = req.studentId?.name || '';
    const studentEmail = req.studentId?.email || '';
    const batchName = req.batchId?.batchName || '';

    const matchesSearch = 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batchName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBatch = 
      !selectedBatch || 
      req.batchId?._id === selectedBatch || 
      req.batchId === selectedBatch;

    return matchesSearch && matchesBatch;
  });

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join Requests</h1>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search student name or email..."
            className="input-field pl-9 py-1.5 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={fetchRequests}
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

        <button 
          onClick={() => { setSearchTerm(''); setSelectedBatch(''); }}
          className="px-3 py-1.5 flex items-center justify-center gap-1.5 font-medium text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100 dark:border-rose-800/50 whitespace-nowrap cursor-pointer w-full sm:w-auto sm:ml-auto"
          title="Reset Filters"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <Clock className="w-12 h-12 mb-3 text-slate-300" />
            <p>No pending join requests found matching the filters.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden p-4">
              {filteredRequests.map((req) => (
                <div key={req._id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">{req.studentId?.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{req.studentId?.email}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold">
                      {req.batchId?.batchName}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-3">
                    <button 
                      onClick={() => handleAction(req._id, 'approve')}
                      disabled={actionLoading.id === req._id}
                      className="flex-1 flex justify-center items-center gap-1 px-3 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading.id === req._id && actionLoading.action === 'approve' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UserCheck size={16} />
                      )}
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req._id, 'reject')}
                      disabled={actionLoading.id === req._id}
                      className="flex-1 flex justify-center items-center gap-1 px-3 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading.id === req._id && actionLoading.action === 'reject' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UserX size={16} />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Student Name</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Email</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Requested Batch</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Date</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req._id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{req.studentId?.name}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{req.studentId?.email}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                          {req.batchId?.batchName}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleAction(req._id, 'approve')}
                          disabled={actionLoading.id === req._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {actionLoading.id === req._id && actionLoading.action === 'approve' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <UserCheck size={16} />
                          )}
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(req._id, 'reject')}
                          disabled={actionLoading.id === req._id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {actionLoading.id === req._id && actionLoading.action === 'reject' ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <UserX size={16} />
                          )}
                          Reject
                        </button>
                      </td>
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

export default EnrollmentRequests;
