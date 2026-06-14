import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Code, Link as LinkIcon, Loader2 } from 'lucide-react';
import Loader from '../../components/Loader';

const AdminLeetcode = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    problemLink: '',
    batchId: ''
  });
  const [pastProblems, setPastProblems] = useState([]);

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
      Swal.fire('Success', 'LeetCode problem allocated successfully. Deadline set to 24 hours from now.', 'success');
      setFormData({ ...formData, title: '', problemLink: '' });
      fetchProblems(formData.batchId);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Could not allocate problem.', 'error');
    } finally {
      setSubmitting(false);
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
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Problem History for Selected Batch</h2>
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[500px]">
              {pastProblems.length > 0 ? (
                <div className="space-y-3">
                  {pastProblems.map(p => {
                    const isActive = new Date(p.deadline) > new Date();
                    return (
                      <div key={p._id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                            {p.title}
                            {isActive && <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">Active</span>}
                          </h3>
                          <a href={p.problemLink} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline mt-1 truncate max-w-[200px] sm:max-w-xs block">
                            {p.problemLink}
                          </a>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Deadline</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {new Date(p.deadline).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">
                  No problems allocated to this batch yet.
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
