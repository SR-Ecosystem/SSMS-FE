import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, FileText, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import Loader from '../../components/Loader';

const LeaveApplication = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      const { data } = await axios.get('/leaves/my');
      setLeaves(data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.reason) return;
    
    setSubmitting(true);
    try {
      await axios.post('/leaves', formData);
      Swal.fire({
        title: 'Success',
        text: 'Leave application submitted successfully.',
        icon: 'success'
      });
      setFormData({ date: '', reason: '' });
      fetchLeaves();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to submit leave application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14}/> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14}/> Pending</span>;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="text-indigo-500" />
          Leave Application
        </h1>
        <p className="text-sm text-slate-500 mt-1">Apply for leave and track your requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Application Form */}
        <div className="lg:col-span-1 glass-panel p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">New Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Leave</label>
              <input 
                type="date" 
                required 
                className="input-field w-full"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
              <textarea 
                required 
                rows="4"
                className="input-field w-full"
                placeholder="Please state the reason for your leave..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              className="btn-primary w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? 'Submitting...' : <><Send size={18} /> Submit Application</>}
            </button>
          </form>
        </div>

        {/* Leave History */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <FileText size={20} className="text-slate-400" /> My Leave History
          </h3>
          
          <div className="overflow-x-auto">
            {leaves.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>You haven't requested any leaves yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Reason</th>
                    <th className="p-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {leave.date}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {leave.reason}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap flex justify-end">
                        {renderStatus(leave.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplication;
