import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Loader2, Upload, ExternalLink, Calendar, FileText as FileTextIcon, UploadCloud, Link as LinkIcon, AlignLeft, Download, CheckCircle } from 'lucide-react';
import Loader from '../../components/Loader';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [subData, setSubData] = useState({ 
    submissionType: 'text', 
    textContent: '', 
    linkUrl: '', 
    remarks: '' 
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

  const fetchTasks = async () => {
    try {
      const [tasksRes, subsRes] = await Promise.all([
        axios.get('/tasks'),
        axios.get('/submissions') // Returns student's submissions
      ]);
      
      // Sort tasks by allocation date (newest first)
      const sortedTasks = tasksRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTasks(sortedTasks);
      setSubmissions(subsRes.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = null;

      if (subData.submissionType === 'file' && selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        
        const uploadRes = await axios.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        fileUrl = uploadRes.data.url;
      }

      await axios.post('/submissions', {
        taskId: activeTask._id,
        submissionType: subData.submissionType,
        textContent: subData.textContent,
        linkUrl: subData.linkUrl,
        fileUrl,
        remarks: subData.remarks
      });

      setActiveTask(null);
      setSubData({ submissionType: 'text', textContent: '', linkUrl: '', remarks: '' });
      setSelectedFile(null);
      fetchTasks();
      Swal.fire({ title: 'Success', text: 'Task submitted successfully!', icon: 'success' });
    } catch (error) {
      Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Error submitting task', icon: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleViewSubmission = (sub) => {
    if (sub.submissionType === 'link' && sub.linkUrl) {
      window.open(sub.linkUrl, '_blank');
    } else if (sub.submissionType === 'file' && sub.fileUrl) {
      const url = sub.fileUrl.startsWith('http') ? sub.fileUrl : `http://localhost:5000${sub.fileUrl}`;
      window.open(url, '_blank');
    } else if (sub.submissionType === 'text') {
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(`
          <html>
            <head>
              <title>Submitted Work</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; }
                .ql-editor { font-size: 16px; }
                .remarks { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px; }
              </style>
              <link rel="stylesheet" href="https://cdn.quilljs.com/1.3.6/quill.snow.css" />
            </head>
            <body>
              <h2 style="margin-bottom: 5px;">My Submitted Work</h2>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
              <div class="ql-editor" style="padding: 0;">${sub.textContent || '<p>No text content submitted.</p>'}</div>
              ${sub.remarks ? `<div class="remarks"><h4 style="margin-top: 0;">Remarks</h4><p style="margin-bottom: 0;">${sub.remarks}</p></div>` : ''}
            </body>
          </html>
        `);
        newWin.document.close();
      }
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks.map(task => {
          const submission = submissions.find(s => s.taskId?._id === task._id || s.taskId === task._id);
          const isSubmitted = submission && submission.status !== 'resubmit';
          
          // Check if the task is new (created within the last 24 hours)
          const isNew = new Date(task.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          // Check if the task is overdue
          const isOverdue = new Date() > new Date(task.dueDate).setHours(23, 59, 59, 999) && !isSubmitted;

          return (
            <div key={task._id} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-black/50 p-6 sm:p-8 flex flex-col group hover:scale-[1.02] transition-transform duration-300 ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
              
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-base text-slate-800 dark:text-white leading-tight">{task.title}</h3>
                    {isNew && (
                      <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse shadow-md shadow-rose-500/30">New</span>
                    )}
                    {isOverdue && (
                      <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-red-200 dark:border-red-800/50">Overdue</span>
                    )}
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{task.batchId?.batchName}</span>
                </div>
              </div>
              
              {task.taskType === 'file' && task.fileUrl ? (
                <div className="mb-6 flex flex-col gap-2 flex-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Please download the instructions file below:</p>
                  <a 
                    href={task.fileUrl.startsWith('http') ? task.fileUrl : `http://localhost:5000${task.fileUrl}`} 
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
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/50 pt-5 mt-auto">
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border whitespace-nowrap ${isOverdue ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' : 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400'}`}>
                  <Calendar size={14} /> Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
                {isSubmitted ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => handleViewSubmission(submission)}
                      className="text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                    >
                      <ExternalLink size={14} /> View Work
                    </button>
                    <span className={`px-4 py-2 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm whitespace-nowrap ${submission.status === 'graded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'}`}>
                      {submission.status === 'graded' ? 'Graded' : 'Submitted'}
                    </span>
                  </div>
                ) : (
                  <button onClick={() => setActiveTask(task)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-2 px-5 text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
                    <Upload size={18} /> {submission?.status === 'resubmit' ? 'Resubmit Task' : 'View & Submit'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400">No active tasks found for your batches.</div>
        )}
      </div>

      {activeTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Submit Task</h2>
              <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">&times;</button>
            </div>
            
            <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 border-b border-primary-100 dark:border-primary-900/30">
              <p className="font-semibold text-primary-900 dark:text-primary-300">{activeTask.title}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[85vh]">
              
              {/* Submission Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">How would you like to submit?</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button 
                    type="button"
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${subData.submissionType === 'text' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setSubData({...subData, submissionType: 'text'})}
                  >
                    <AlignLeft size={16} /> Text
                  </button>
                  <button 
                    type="button"
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${subData.submissionType === 'file' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setSubData({...subData, submissionType: 'file'})}
                  >
                    <UploadCloud size={16} /> File
                  </button>
                  <button 
                    type="button"
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${subData.submissionType === 'link' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    onClick={() => setSubData({...subData, submissionType: 'link'})}
                  >
                    <LinkIcon size={16} /> Link
                  </button>
                </div>
              </div>

              {/* Dynamic Submission Input */}
              {subData.submissionType === 'text' && (
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Text / Code Submission</label>
                  <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <ReactQuill 
                      theme="snow" 
                      value={subData.textContent} 
                      onChange={(val) => setSubData({...subData, textContent: val})} 
                      modules={quillModules}
                      className="h-64 mb-12 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {subData.submissionType === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Upload Submission File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                        <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" required={subData.submissionType === 'file'} onChange={handleFileChange} />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {selectedFile ? selectedFile.name : 'ZIP, PDF, DOCX (Max 50MB)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subData.submissionType === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Project Link / GitHub URL</label>
                  <input required type="url" className="input-field" placeholder="https://..." value={subData.linkUrl} onChange={e => setSubData({...subData, linkUrl: e.target.value})} />
                </div>
              )}

              {/* Remarks Box */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Remarks / Comments (Optional)</label>
                <textarea className="input-field" rows="2" placeholder="Any additional comments for the reviewer?" value={subData.remarks} onChange={e => setSubData({...subData, remarks: e.target.value})}></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveTask(null)} className="flex-1 py-2 px-4 rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 btn-primary flex justify-center items-center gap-2">
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {uploading ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
