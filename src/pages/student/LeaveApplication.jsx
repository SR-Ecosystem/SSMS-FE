import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Calendar, FileText, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import Loader from '../../components/Loader';

const LeaveApplication = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    leaveType: 'full_day',
    startDate: '', 
    endDate: '', 
    startTime: '', 
    endTime: '', 
    reason: '' 
  });
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
    if (!formData.startDate || !formData.reason) return;
    
    setSubmitting(true);
    try {
      await axios.post('/leaves', formData);
      Swal.fire({
        title: 'Success',
        text: 'Leave application submitted successfully.',
        icon: 'success'
      });
      setFormData({ 
        leaveType: 'full_day',
        startDate: '', 
        endDate: '', 
        startTime: '', 
        endTime: '', 
        reason: '' 
      });
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Leave Type</label>
              <select 
                className="input-field w-full mb-4"
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              >
                <option value="full_day">Full Day</option>
                <option value="multiple_days">Multiple Days</option>
                <option value="hours">Specific Hours</option>
              </select>
            </div>

            {formData.leaveType === 'multiple_days' ? (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    required 
                    className="input-field w-full"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input 
                    type="date" 
                    required 
                    className="input-field w-full"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input 
                  type="date" 
                  required 
                  className="input-field w-full"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            )}

            {formData.leaveType === 'hours' && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                  <input 
                    type="time" 
                    required 
                    className="input-field w-full"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                  <input 
                    type="time" 
                    required 
                    className="input-field w-full"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}
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
                    <th className="p-4 font-semibold">Date/Time</th>
                    <th className="p-4 font-semibold">Reason</th>
                    <th className="p-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {leave.leaveType === 'multiple_days' ? (
                          <span>{leave.startDate} <span className="text-slate-400 font-normal mx-1">to</span> {leave.endDate}</span>
                        ) : leave.leaveType === 'hours' ? (
                          <div className="flex flex-col">
                            <span>{leave.startDate}</span>
                            <span className="text-xs text-indigo-500 font-medium">{leave.startTime} - {leave.endTime}</span>
                          </div>
                        ) : (
                          <span>{leave.startDate || leave.date}</span>
                        )}
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
