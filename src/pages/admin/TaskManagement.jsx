import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { BookOpen, Plus, Loader2, UploadCloud, FileText as FileTextIcon, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import Loader from '../../components/Loader';

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [filterBatch, setFilterBatch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    dueDate: '', 
    maxMarks: 100, 
    batchId: '',
    taskType: 'text',
    category: 'General'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ]
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, batchesRes] = await Promise.all([
        axios.get(`/tasks${filterBatch ? `?batchId=${filterBatch}` : ''}`),
        axios.get('/batches')
      ]);
      setTasks(tasksRes.data);
      setBatches(batchesRes.data);
      if(batchesRes.data.length > 0) setFormData(f => ({...f, batchId: batchesRes.data[0]._id}));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterBatch]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const openCreateModal = () => {
    setEditingTaskId(null);
    setFormData({
      title: '', description: '', dueDate: '', maxMarks: 100,
      batchId: batches[0]?._id || '', taskType: 'text', category: 'General'
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleEdit = (task) => {
    setEditingTaskId(task._id);
    setFormData({
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      maxMarks: task.maxMarks,
      batchId: task.batchId?._id || task.batchId,
      taskType: task.taskType || 'text',
      linkUrl: task.linkUrl || '',
      category: task.category || 'General'
    });
    setSelectedFile(null);
    setShowModal(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = null;

      // 1. Upload file if taskType is 'file'
      if (formData.taskType === 'file' && selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        
        const uploadRes = await axios.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = uploadRes.data.url;
      }

      // 2. Create or Update the task
      if (editingTaskId) {
        await axios.put(`/tasks/${editingTaskId}`, {
          ...formData,
          ...(fileUrl && { fileUrl }) // only update fileUrl if a new file was uploaded
        });
        Swal.fire('Success!', 'Task updated successfully.', 'success');
      } else {
        await axios.post('/tasks', {
          ...formData,
          fileUrl
        });
        Swal.fire('Success!', 'Task assigned successfully.', 'success');
      }

      setShowModal(false);
      fetchData();
      setEditingTaskId(null);
      setFormData({ 
        title: '', description: '', dueDate: '', maxMarks: 100, 
        batchId: batches[0]?._id || '', taskType: 'text', category: 'General' 
      });
      setSelectedFile(null);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Could not save task.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleViewTaskText = (task) => {
    const newWin = window.open('', '_blank');
    if (newWin) {
      newWin.document.write(`
        <html>
          <head>
            <title>${task.title} - Instructions</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
              .ql-editor { font-size: 16px; }
            </style>
            <link rel="stylesheet" href="https://cdn.quilljs.com/1.3.6/quill.snow.css" />
          </head>
          <body>
            <h2 style="margin-bottom: 5px;">${task.title}</h2>
            <p style="color: #666; margin-top: 0;">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
            <div class="ql-editor" style="padding: 0;">${task.description || '<p>No instructions provided.</p>'}</div>
          </body>
        </html>
      `);
      newWin.document.close();
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Task Management</h1>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <select 
            className="input-field py-1.5 text-sm appearance-none min-w-[200px]"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>
          <button 
            onClick={openCreateModal} 
            className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-2.5 px-6 text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 whitespace-nowrap w-full sm:w-auto cursor-pointer"
          >
            <Plus size={18} /> Assign Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks.map(task => {
          const isOverdue = new Date() > new Date(task.dueDate).setHours(23, 59, 59, 999);
          return (
          <div key={task._id} className={`glass-panel p-6 card-hover border-l-4 flex flex-col ${isOverdue ? 'border-l-red-500' : 'border-l-primary-500'}`}>
            <div className="flex justify-between items-start mb-4 gap-4">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{task.title}</h3>
                {isOverdue && (
                  <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-red-200 dark:border-red-800/50">Overdue</span>
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
                  href={task.fileUrl.startsWith('http') ? task.fileUrl : `https://ssms-be.onrender.com${task.fileUrl}`} 
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

            <div className="flex items-center gap-4 text-sm font-medium mt-auto">
              <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">Max Marks: {task.maxMarks}</span>
              <span className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded font-bold">{task.category || 'General'}</span>
              <span className={`px-2 py-1 rounded ${isOverdue ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30'}`}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        )})}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingTaskId ? 'Edit Task' : 'Assign New Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[85vh]">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Task Title</label>
                <input required type="text" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              {/* Task Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Instructions Format</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button 
                    type="button"
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${formData.taskType === 'text' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setFormData({...formData, taskType: 'text'})}
                  >
                    Text Instructions
                  </button>
                  <button 
                    type="button"
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${formData.taskType === 'file' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setFormData({...formData, taskType: 'file'})}
                  >
                    File Upload
                  </button>
                  <button 
                    type="button"
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${formData.taskType === 'link' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setFormData({...formData, taskType: 'link'})}
                  >
                    Link URL
                  </button>
                </div>
              </div>

              {formData.taskType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Task Instructions</label>
                  <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <ReactQuill theme="snow" value={formData.description} onChange={(val) => setFormData({...formData, description: val})} modules={quillModules} className="h-48 mb-12" />
                  </div>
                </div>
              )}

              {formData.taskType === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Upload Task File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                        <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {selectedFile ? selectedFile.name : (formData.fileUrl ? 'File uploaded. Choose another to replace.' : 'Any file up to 50MB')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.taskType === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Task Link URL</label>
                  <input required type="url" className="input-field" placeholder="https://..." value={formData.linkUrl || ''} onChange={e => setFormData({...formData, linkUrl: e.target.value})} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Due Date</label>
                  <input required type="date" className="input-field" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Max Marks</label>
                  <input required type="number" className="input-field" value={formData.maxMarks} onChange={e => setFormData({...formData, maxMarks: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Select Batch</label>
                <select className="input-field" required value={formData.batchId} onChange={e => setFormData({...formData, batchId: e.target.value})}>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Task Category (CW/HW)</label>
                <select className="input-field" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="General">General</option>
                  <option value="CW">Classwork (CW)</option>
                  <option value="HW">Homework (HW)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 btn-primary flex justify-center items-center gap-2">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {uploading ? 'Saving...' : (editingTaskId ? 'Update Task' : 'Assign Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
