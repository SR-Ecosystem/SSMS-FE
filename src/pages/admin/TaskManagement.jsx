import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { BookOpen, Plus, FileText as FileTextIcon, Edit, Trash2, Link as LinkIcon, RefreshCw, Search, RotateCcw, CheckCircle, Clock, Calendar } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

const TaskManagement = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filterBatch, setFilterBatch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, batchesRes] = await Promise.all([
        axios.get(`/tasks${filterBatch ? `?batchId=${filterBatch}` : ''}`),
        axios.get('/batches')
      ]);
      setTasks(tasksRes.data);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [filterBatch]);

  // Tab synchronization: Auto-refresh when localStorage change notification triggers
  useEffect(() => {
    const handleSyncRefresh = (e) => {
      if (e.key === 'task_management_refresh') {
        fetchData();
      }
    };
    window.addEventListener('storage', handleSyncRefresh);
    return () => window.removeEventListener('storage', handleSyncRefresh);
  }, []);

  const openCreateModal = () => {
    navigate('/tasks/create');
  };

  const handleEdit = (task) => {
    navigate(`/tasks/edit/${task._id}`);
  };

  const handleDelete = async (taskId) => {
    const result = await Swal.fire({
      title: 'Delete Task?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/tasks/${taskId}`);
        fetchData();
        Swal.fire('Deleted!', 'Task has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not delete task.', 'error');
      }
    }
  };

  const handleAssignNow = async (task) => {
    const result = await Swal.fire({
      title: 'Assign Task Now?',
      text: 'This will publish the task immediately, making it visible to all students of the batch.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, assign now!'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`/tasks/${task._id}`, {
          scheduledAt: null
        });
        fetchData();
        
        // Trigger cross-tab local storage update notification
        localStorage.setItem('task_management_refresh', Date.now().toString());

        Swal.fire({
          title: 'Assigned!',
          text: 'Task has been assigned immediately.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not assign task.', 'error');
      }
    }
  };

  const handleViewTaskText = (task) => {
    const newWin = window.open('', '_blank');
    if (newWin) {
      const typeLabel = task.category === 'Project' ? 'Project' : 'Task';
      const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A';

      newWin.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${task.title}</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #fafafa;
              margin: 0;
              padding: 2rem;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
            }
            .container {
              background-color: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 1rem;
              padding: 2.5rem;
              width: 100%;
              max-width: 800px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
            }
            h1 {
              font-size: 2.25rem;
              font-weight: 800;
              color: #0f172a;
              margin-top: 0;
              margin-bottom: 1.5rem;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 1rem;
            }
            .meta-info {
              display: flex;
              flex-wrap: wrap;
              gap: 1.5rem;
              margin-bottom: 2rem;
              background-color: #f8fafc;
              padding: 1rem 1.5rem;
              border-radius: 0.75rem;
              border: 1px dashed #e2e8f0;
            }
            .meta-item {
              font-size: 0.875rem;
              color: #64748b;
            }
            .meta-item strong {
              color: #334155;
            }
            .content {
              font-size: 1.05rem;
              color: #334155;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              margin: 1.5rem 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
            }
            pre {
              background-color: #f8fafc;
              padding: 1.25rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              border: 1px solid #e2e8f0;
              max-width: 100%;
            }
            code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              color: #ea580c;
              background-color: #f1f5f9;
              padding: 0.2rem 0.4rem;
              border-radius: 0.25rem;
              font-size: 0.875rem;
            }
            pre code {
              color: inherit;
              background-color: transparent;
              padding: 0;
              border-radius: 0;
              font-size: 0.875rem;
            }
            a {
              color: #ea580c;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            p {
              margin-top: 0;
              margin-bottom: 1rem;
            }
            ul, ol {
              margin-top: 0;
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            li {
              margin-bottom: 0.25rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${task.title}</h1>
            <div class="meta-info">
              <div class="meta-item">Type: <strong>${typeLabel}</strong></div>
              <div class="meta-item">Batch: <strong>${task.batchId?.batchName || 'N/A'}</strong></div>
              ${task.dueDate ? `<div class="meta-item">Deadline: <strong>${formattedDate}</strong></div>` : ''}
              ${task.maxMarks !== undefined ? `<div class="meta-item">Marks: <strong>${task.maxMarks}</strong></div>` : ''}
            </div>
            <div class="content">
              ${task.description || '<p>No instructions provided.</p>'}
            </div>
          </div>
        </body>
        </html>
      `);
      newWin.document.close();
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterBatch('');
  };

  const filteredTasks = tasks.filter(task => {
    const titleText = task.title || '';
    const descText = task.description || '';
    const matchesSearch = 
      titleText.toLowerCase().includes(searchTerm.toLowerCase()) || 
      descText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      filterCategory === 'All' || 
      task.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) return <SkeletonLoader type="card-grid" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Task Management</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={openCreateModal} 
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-2.5 px-6 text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto cursor-pointer font-medium"
          >
            <Plus size={18} /> Assign Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search task title or description..."
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
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
        >
          <option value="">All Batches</option>
          {batches.map(b => (
            <option key={b._id} value={b._id}>{b.batchName}</option>
          ))}
        </select>

        <select 
          className="input-field py-1.5 text-sm w-full sm:w-auto min-w-[140px]"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="General">General</option>
          <option value="HW">HW</option>
          <option value="CW">CW</option>
          <option value="Project">Project</option>
        </select>

        <button 
          onClick={handleResetFilters}
          className="px-3 py-1.5 flex items-center justify-center gap-1.5 font-medium text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100 dark:border-rose-800/50 whitespace-nowrap cursor-pointer w-full sm:w-auto sm:ml-auto"
          title="Reset Filters"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-400 opacity-50" />
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200">No tasks found</p>
            <p className="text-sm mt-1 font-medium">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = new Date() > new Date(task.dueDate).setHours(23, 59, 59, 999);
            const isScheduled = task.scheduledAt && new Date(task.scheduledAt) > new Date();
            return (
              <div key={task._id} className={`glass-panel p-6 card-hover border-l-4 flex flex-col ${isScheduled ? 'border-l-amber-500' : isOverdue ? 'border-l-red-500' : 'border-l-primary-500'}`}>
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex items-center gap-3 flex-wrap flex-1">
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{task.title}</h3>
                    {isOverdue && (
                      <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-red-200 dark:border-red-800/50">Overdue</span>
                    )}
                    {isScheduled && (
                      <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-200 dark:border-amber-800/50">Scheduled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">{task.batchId?.batchName}</span>
                    <button onClick={() => handleEdit(task)} className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-md transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer" title="Edit Task">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(task._id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer" title="Delete Task">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {task.taskType === 'file' && task.fileUrl ? (
                  <div className="mb-6 flex flex-col gap-2 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Please download the instructions file below:</p>
                    <a 
                      href={task.fileUrl.startsWith('http') ? task.fileUrl : `${import.meta.env.VITE_API_URL}${task.fileUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm rounded-lg w-max hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-bold shadow-sm cursor-pointer"
                    >
                      <FileTextIcon size={16} />
                      Download Instructions
                    </a>
                  </div>
                ) : task.taskType === 'link' ? (
                  <div className="mb-6 flex flex-col gap-2 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Please visit the following link to view the task:</p>
                    <a 
                      href={task.linkUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 text-sm rounded-lg w-max hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-bold shadow-sm cursor-pointer"
                    >
                      <LinkIcon size={16} /> Open Task Link
                    </a>
                  </div>
                ) : (
                  <div className="mb-6 flex flex-col gap-2 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Click below to view the full text instructions:</p>
                    <button 
                      onClick={() => handleViewTaskText(task)}
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-2 text-sm rounded-lg w-max hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-bold shadow-sm cursor-pointer"
                    >
                      <FileTextIcon size={16} /> View Task Details
                    </button>
                  </div>
                )}

                {isScheduled && (
                  <div className="mb-4 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl space-y-3">
                    <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
                      <Clock size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="flex-1">
                        <span className="text-xs font-bold block uppercase tracking-wider text-amber-600 dark:text-amber-500">Scheduled Release</span>
                        <span className="text-sm font-semibold block mt-0.5">
                          {new Date(task.scheduledAt).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAssignNow(task)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5"
                      >
                        <CheckCircle size={14} />
                        Assign Now
                      </button>
                      <button
                        onClick={() => handleEdit(task)}
                        className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5"
                      >
                        <Edit size={14} />
                        Edit Schedule
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 text-sm font-medium mt-auto border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">Max Marks: {task.maxMarks}</span>
                    <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded font-bold">{task.category || 'General'}</span>
                    <span className={`px-2 py-1 rounded ${isOverdue ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'}`}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  {task.scheduledAt && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {isScheduled ? 'Release Schedule' : 'Released'}: <span className="font-semibold text-slate-700 dark:text-slate-200">{new Date(task.scheduledAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
