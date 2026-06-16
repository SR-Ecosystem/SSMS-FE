import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, UserX, Loader2, Clock, RefreshCw } from 'lucide-react';
import Loader from '../../components/Loader';
import Swal from 'sweetalert2';

const EnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ id: null, action: null });

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('/enrollments/pending');
      setRequests(data);
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

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Join Requests</h1>
        <button
          onClick={() => fetchRequests()}
          disabled={loading}
          className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          title="Refresh Data"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <Clock className="w-12 h-12 mb-3 text-slate-300" />
            <p>No pending join requests at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Student Name</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Email</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Requested Batch</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Date</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{req.studentId?.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{req.studentId?.email}</td>
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
        )}
      </div>
    </div>
  );
};

export default EnrollmentRequests;
