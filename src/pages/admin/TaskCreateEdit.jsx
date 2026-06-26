import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { BookOpen, Loader2, UploadCloud, FileText as FileTextIcon, Link as LinkIcon, Save, X, ArrowLeft } from 'lucide-react';
import Loader from '../../components/Loader';

const formatLocalISO = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const localTime = new Date(d.getTime() - (offset * 60 * 1000));
  return localTime.toISOString().slice(0, 16);
};

const TaskCreateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    dueDate: '', 
    maxMarks: 100, 
    batchId: '',
    taskType: 'text',
    category: 'General',
    scheduledAt: '',
    linkUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  useEffect(() => {
    const fetchBatchesAndTask = async () => {
      try {
        setLoading(true);
        const batchesRes = await axios.get('/batches');
        setBatches(batchesRes.data);

        if (isEditMode) {
          const taskRes = await axios.get(`/tasks/${id}`);
          const task = taskRes.data;
          setFormData({
            title: task.title,
            description: task.description,
            dueDate: new Date(task.dueDate).toISOString().split('T')[0],
            maxMarks: task.maxMarks,
            batchId: task.batchId?._id || task.batchId,
            taskType: task.taskType || 'text',
            linkUrl: task.linkUrl || '',
            category: task.category || 'General',
            scheduledAt: task.scheduledAt ? formatLocalISO(task.scheduledAt) : '',
            fileUrl: task.fileUrl || ''
          });
        } else if (batchesRes.data.length > 0) {
          setFormData(f => ({ ...f, batchId: batchesRes.data[0]._id }));
        }
      } catch (error) {
        console.error('Failed to fetch task allocation resources:', error);
        Swal.fire('Error', 'Could not load required resource data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchesAndTask();
  }, [id, isEditMode]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let fileUrl = formData.fileUrl || null;

      // 1. Upload file if taskType is 'file' and a new file is selected
      if (formData.taskType === 'file' && selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        
        const uploadRes = await axios.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = uploadRes.data.url;
      }

      // 2. Save/Update task
      if (isEditMode) {
        await axios.put(`/tasks/${id}`, {
          ...formData,
          fileUrl
        });
        Swal.fire({
          title: 'Updated!',
          text: 'Task has been updated successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await axios.post('/tasks', {
          ...formData,
          fileUrl
        });
        Swal.fire({
          title: 'Assigned!',
          text: 'Task has been created and assigned successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }

      // Trigger cross-tab local storage update notification
      localStorage.setItem('task_management_refresh', Date.now().toString());

      // Redirect back to task list
      setTimeout(() => {
        navigate('/tasks');
      }, 1000);
    } catch (error) {
      console.error('Error saving task:', error);
      Swal.fire('Error', error.response?.data?.message || 'Could not save the task.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/tasks');
  };

  if (loading) return <div className="p-12"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back button header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={handleCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {isEditMode ? 'Edit Task Details' : 'Assign New Task'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {isEditMode ? 'Modify and refine instructions or scheduling' : 'Create assignments and push to selected batches'}
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Title</label>
            <input 
              required 
              type="text" 
              className="input-field py-2.5 px-4 text-base rounded-xl font-medium shadow-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
              placeholder="Enter a descriptive task title"
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Instructions Format</label>
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/30">
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.taskType === 'text' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                onClick={() => setFormData({...formData, taskType: 'text'})}
              >
                Text Instructions
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.taskType === 'file' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                onClick={() => setFormData({...formData, taskType: 'file'})}
              >
                File Upload
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.taskType === 'link' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                onClick={() => setFormData({...formData, taskType: 'link'})}
              >
                Link URL
              </button>
            </div>
          </div>

          {/* Text Editor */}
          {formData.taskType === 'text' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Instructions (Rich Text)</label>
              <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                <ReactQuill 
                  theme="snow" 
                  value={formData.description} 
                  onChange={(val) => setFormData({...formData, description: val})} 
                  modules={quillModules} 
                  className="h-[550px] mb-16" 
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          {formData.taskType === 'file' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Upload Task Instruction File</label>
              <div className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-800/10">
                <div className="space-y-2 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-indigo-500" />
                  <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                    <label className="relative cursor-pointer bg-transparent rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                      <span>Choose file</span>
                      <input type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedFile ? selectedFile.name : (formData.fileUrl ? 'File already uploaded. Choose another to overwrite.' : 'Any document or archive up to 50MB')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Link URL */}
          {formData.taskType === 'link' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Instructions Link URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required 
                  type="url" 
                  className="input-field pl-11 py-2.5 px-4 rounded-xl" 
                  placeholder="https://example.com/assignment-docs" 
                  value={formData.linkUrl || ''} 
                  onChange={e => setFormData({...formData, linkUrl: e.target.value})} 
                />
              </div>
            </div>
          )}

          {/* Due Date & Max Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Due Date</label>
              <input 
                required 
                type="date" 
                className="input-field py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                value={formData.dueDate} 
                onChange={e => setFormData({...formData, dueDate: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Max Marks</label>
              <input 
                required 
                type="number" 
                className="input-field py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                value={formData.maxMarks} 
                onChange={e => setFormData({...formData, maxMarks: Number(e.target.value)})} 
              />
            </div>
          </div>

          {/* Select Batch & Task Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Select Batch Target</label>
              <select 
                className="input-field py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium" 
                required 
                value={formData.batchId} 
                onChange={e => setFormData({...formData, batchId: e.target.value})}
              >
                {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Category (CW/HW)</label>
              <select 
                className="input-field py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium" 
                required 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="General">General</option>
                <option value="CW">Classwork (CW)</option>
                <option value="HW">Homework (HW)</option>
                <option value="Project">Project</option>
              </select>
            </div>
          </div>

          {/* Scheduled Release */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Schedule Release (Optional)</label>
            <input 
              type="datetime-local" 
              className="input-field py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
              value={formData.scheduledAt || ''} 
              onChange={e => setFormData({...formData, scheduledAt: e.target.value})} 
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              Leave empty to release immediately. If set, students will not see this task until the scheduled date-time.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="pt-6 flex gap-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer border border-transparent hover:scale-[1.01]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving} 
              className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 text-sm shadow-md shadow-indigo-500/20 hover:scale-[1.01] transition-all cursor-pointer"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : (isEditMode ? 'Update Task' : 'Assign Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreateEdit;
