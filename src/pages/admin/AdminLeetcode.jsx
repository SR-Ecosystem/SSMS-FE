import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Code, Link as LinkIcon, Loader2, RefreshCw, Search, Clock, Edit, Trash2, CheckCircle } from 'lucide-react';
import Loader from '../../components/Loader';

const AdminLeetcode = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    problemLink: '',
    batchId: '',
    scheduledAt: ''
  });
  const [pastProblems, setPastProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProblems = async (bId) => {
    try {
      const { data } = await axios.get(`/leetcode/batch/${bId}`);
      setPastProblems(data);
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('/batches');
        setBatches(data);
        if (data.length > 0) {
          setFormData(f => ({ ...f, batchId: data[0]._id }));
          fetchProblems(data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  const handleBatchChange = (e) => {
    const bId = e.target.value;
    setFormData({ ...formData, batchId: bId });
    fetchProblems(bId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/leetcode', formData);
      const isScheduled = !!formData.scheduledAt;
      Swal.fire(
        'Success', 
        isScheduled 
          ? 'LeetCode problem scheduled successfully.' 
          : 'LeetCode problem allocated successfully. Deadline set to 24 hours from now.', 
        'success'
      );
      setFormData({ ...formData, title: '', problemLink: '', scheduledAt: '' });
      fetchProblems(formData.batchId);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Could not allocate problem.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignNow = async (problem) => {
    const result = await Swal.fire({
      title: 'Assign Challenge Now?',
      text: 'This will publish the challenge immediately and start the 24-hour countdown.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, assign now!'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`/leetcode/${problem._id}`, { scheduledAt: null });
        fetchProblems(formData.batchId);
        Swal.fire('Assigned!', 'Challenge is now live.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not assign challenge.', 'error');
      }
    }
  };

  const handleEditSchedule = async (problem) => {
    const { value: newDateTime } = await Swal.fire({
      title: 'Reschedule Challenge',
      html: `
        <div class="text-left font-medium text-sm text-slate-600 dark:text-slate-400 mb-2">Select new release date and time:</div>
        <input type="datetime-local" id="swal-scheduled-at" class="swal2-input !m-0 !w-full" value="${problem.scheduledAt ? new Date(problem.scheduledAt).toISOString().slice(0, 16) : ''}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Reschedule',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const val = document.getElementById('swal-scheduled-at').value;
        if (!val) {
          Swal.showValidationMessage('Please select a valid date & time');
        }
        return val;
      }
    });

    if (newDateTime) {
      try {
        await axios.put(`/leetcode/${problem._id}`, { scheduledAt: newDateTime });
        fetchProblems(formData.batchId);
        Swal.fire('Rescheduled!', 'Challenge schedule has been updated.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not reschedule challenge.', 'error');
      }
    }
  };

  const handleDelete = async (problemId) => {
    const result = await Swal.fire({
      title: 'Delete Challenge?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/leetcode/${problemId}`);
        fetchProblems(formData.batchId);
        Swal.fire('Deleted!', 'Challenge has been removed.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not delete challenge.', 'error');
      }
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code className="text-primary-500" />
            LeetCode Challenges
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Allocate daily problems and maintain streaks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Allocate Problem</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Select Batch</label>
                <select className="input-field" required value={formData.batchId} onChange={handleBatchChange}>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.batchName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Problem Title</label>
                <input type="text" className="input-field" required placeholder="e.g. Two Sum" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">LeetCode URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="url" className="input-field pl-9" required placeholder="https://leetcode.com/problems/..." value={formData.problemLink} onChange={e => setFormData({ ...formData, problemLink: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Schedule Release (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="input-field" 
                  value={formData.scheduledAt || ''} 
                  onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })} 
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Leave empty to release immediately. If scheduled, students won't see this challenge until the set time.
                </p>
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={submitting} className="btn-primary w-full flex justify-center items-center gap-2">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {submitting ? 'Allocating...' : 'Allocate Challenge'}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                Problem will automatically expire in 24 hours.
              </p>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Problem History for Selected Batch</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search problem..."
                    className="input-field pl-8 py-1 px-3 text-xs w-40 sm:w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => fetchProblems(formData.batchId)}
                  className="p-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Refresh History"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[500px]">
              {pastProblems.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                <div className="space-y-3">
                  {pastProblems
                    .filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(p => {
                      const isScheduled = p.scheduledAt && new Date(p.scheduledAt) > new Date();
                      const isActive = new Date(p.deadline) > new Date() && !isScheduled;
                      return (
                        <div key={p._id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${isScheduled ? 'border-amber-200/60 bg-amber-50/10 dark:border-amber-900/40 dark:bg-amber-950/5' : 'border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}>
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 flex-wrap">
                                {p.title}
                                {isScheduled && <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800/50">Scheduled</span>}
                                {isActive && <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Active</span>}
                              </h3>
                              <a href={p.problemLink} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline mt-1 truncate max-w-[200px] sm:max-w-xs block">
                                {p.problemLink}
                              </a>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end w-full sm:w-auto">
                              <div className="text-left sm:text-right">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  {isScheduled ? 'Release Schedule' : 'Deadline'}
                                </p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                                  {new Date(isScheduled ? p.scheduledAt : p.deadline).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 ml-auto sm:ml-0">
                                {isScheduled && (
                                  <button
                                    onClick={() => handleAssignNow(p)}
                                    className="p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:shadow-sm transition-colors cursor-pointer"
                                    title="Assign Challenge Now"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditSchedule(p)}
                                  className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:shadow-sm transition-colors cursor-pointer"
                                  title="Reschedule / Edit Schedule"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(p._id)}
                                  className="p-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:shadow-sm transition-colors cursor-pointer"
                                  title="Delete Challenge"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">
                  {pastProblems.length > 0 ? 'No matching problems found.' : 'No problems allocated to this batch yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeetcode;
