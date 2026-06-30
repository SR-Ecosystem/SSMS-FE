import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Loader2, Upload, ExternalLink, Calendar, FileText as FileTextIcon, UploadCloud, Link as LinkIcon, AlignLeft, Download, CheckCircle } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  return `${dd}/${mm}/${yy} - ${timeStr}`;
};

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(true); // default to true until checked
  const [activeTask, setActiveTask] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [studentSubmittedLinks, setStudentSubmittedLinks] = useState([]);
  const { themeColor, activeTheme } = useOutletContext();
  
  const [subData, setSubData] = useState({ 
    submissionType: 'text', 
    textContent: '', 
    linkUrl: '', 
    remarks: '' 
  });

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
      // First check if enrolled
      const enrollRes = await axios.get('/enrollments/my');
      const approvedEnrollments = enrollRes.data.filter(e => e.status === 'approved');
      
      if (approvedEnrollments.length === 0) {
        setIsEnrolled(false);
        setLoading(false);
        return; // Don't fetch tasks if not enrolled
      }

      setIsEnrolled(true);
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

  const handleOpenSubmitModal = (task) => {
    setActiveTask(task);
    const existingSub = submissions.find(s => s.taskId?._id === task._id || s.taskId === task._id);
    if (existingSub) {
      setSubData({
        submissionType: existingSub.submissionType || 'text',
        textContent: existingSub.textContent || '',
        linkUrl: existingSub.linkUrl || '',
        remarks: existingSub.remarks || ''
      });
      setStudentSubmittedLinks(existingSub.submittedLinks || []);
    } else {
      setSubData({ submissionType: 'text', textContent: '', linkUrl: '', remarks: '' });
      const initialLinks = (task.requiredLinks || []).map(rl => ({ label: rl.label, url: '' }));
      setStudentSubmittedLinks(initialLinks);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let fileUrl = null;

      await axios.post('/submissions', {
        taskId: activeTask._id,
        submissionType: subData.submissionType,
        textContent: subData.textContent,
        linkUrl: subData.linkUrl,
        fileUrl,
        remarks: subData.remarks,
        submittedLinks: studentSubmittedLinks
      });

      setActiveTask(null);
      setSubData({ submissionType: 'text', textContent: '', linkUrl: '', remarks: '' });
      setStudentSubmittedLinks([]);
      fetchTasks();
      Swal.fire({ title: 'Success', text: 'Task submitted successfully!', icon: 'success' });
    } catch (error) {
      Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Error submitting task', icon: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleViewSubmission = async (sub) => {
    if (sub.submissionType === 'link' && sub.linkUrl) {
      window.open(sub.linkUrl, '_blank');
    } else if (sub.submissionType === 'file' && sub.fileUrl) {
      const url = sub.fileUrl.startsWith('http') ? sub.fileUrl : `${import.meta.env.VITE_API_URL}${sub.fileUrl}`;
      window.open(url, '_blank');
    } else if (sub.submissionType === 'text') {
      try {
        Swal.fire({
          title: 'Loading Submission...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        const { data: fullSub } = await axios.get(`/submissions/${sub._id}`);
        Swal.close();
        
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
                <p style="color: #666; margin-top: 0; font-size: 14px;">Submitted on: ${formatDateTime(fullSub.submittedAt || fullSub.createdAt)}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
                <div class="ql-editor" style="padding: 0;">${fullSub.textContent || '<p>No text content submitted.</p>'}</div>
                ${fullSub.remarks ? `<div class="remarks"><h4 style="margin-top: 0;">Remarks</h4><p style="margin-bottom: 0;">${fullSub.remarks}</p></div>` : ''}
              </body>
            </html>
          `);
          newWin.document.close();
        }
      } catch (error) {
        Swal.close();
        console.error('Error fetching submission details:', error);
        Swal.fire('Error', 'Could not fetch submission details.', 'error');
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
            }
            .container {
              max-width: 800px;
              width: 100%;
              background-color: #ffffff;
              padding: 2.5rem;
              border-radius: 1rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
              border: 1px solid #e2e8f0;
            }
            h1 {
              color: #0f172a;
              margin-top: 0;
              font-size: 1.875rem;
              font-weight: 800;
              border-bottom: 2px solid #ea580c;
              padding-bottom: 0.75rem;
              margin-bottom: 1rem;
            }
            .meta-info {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              margin-bottom: 2rem;
              font-size: 0.875rem;
              color: #64748b;
            }
            .meta-item {
              background-color: #f8fafc;
              padding: 0.25rem 0.75rem;
              border-radius: 0.375rem;
              border: 1px solid #e2e8f0;
            }
            .meta-item strong {
              color: #ea580c;
            }
            .content {
              color: #1e293b;
              font-size: 1rem;
              overflow-wrap: break-word;
              word-break: break-word;
            }
            .content * {
              max-width: 100%;
              overflow-wrap: break-word;
              word-break: break-word;
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

  if (loading) return <SkeletonLoader type="table" />;

  if (!isEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
          <FileTextIcon size={40} className="text-rose-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">No Batch Assigned</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 text-lg">
          You are not currently enrolled in any active batch. Please join a batch to get access to your tasks and assignments.
        </p>
        <a href="/student/available-batches" className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/30 text-base">
          View Available Batches
        </a>
      </div>
    );
  }

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
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors"></div>
              
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
                    href={task.fileUrl.startsWith('http') ? task.fileUrl : `${import.meta.env.VITE_API_URL}${task.fileUrl}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-theme-primary bg-primary-500/10 px-3 py-2 text-sm rounded-lg w-max hover:bg-primary-500/25 transition-colors font-bold shadow-sm cursor-pointer"
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
                  <button onClick={() => handleOpenSubmitModal(task)} className="bg-gradient-to-r from-primary-500 to-theme-accent hover:from-primary-600 hover:to-theme-accent text-white font-bold py-2 px-5 text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-theme-primary/30 transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Submit Task</h2>
              <button onClick={() => setActiveTask(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">&times;</button>
            </div>
            
            <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 border-b border-primary-100 dark:border-primary-900/30">
              <p className="font-semibold text-primary-900 dark:text-primary-300">{activeTask.title}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[85vh]">
              
              {activeTask.requiredLinks && activeTask.requiredLinks.length > 0 ? (
                /* Multiple Custom Links Submission Form */
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    Requested Submission Links
                  </h3>
                  {activeTask.requiredLinks.map((reqLink, idx) => {
                    const currentVal = studentSubmittedLinks.find(sl => sl.label === reqLink.label)?.url || '';
                    return (
                      <div key={idx} className="space-y-1.5">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{reqLink.label}</span>
                          <span className={reqLink.isMandatory ? 'text-rose-500 font-bold text-xs' : 'text-slate-400 text-xs'}>
                            {reqLink.isMandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </label>
                        <input
                          required={reqLink.isMandatory}
                          type="url"
                          className="input-field"
                          placeholder="https://..."
                          value={currentVal}
                          onChange={(e) => {
                            const updated = [...studentSubmittedLinks];
                            const existingIdx = updated.findIndex(sl => sl.label === reqLink.label);
                            if (existingIdx > -1) {
                              updated[existingIdx].url = e.target.value;
                            } else {
                              updated.push({ label: reqLink.label, url: e.target.value });
                            }
                            setStudentSubmittedLinks(updated);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Standard Single Field Submission Form */
                <>
                  {/* Submission Type Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">How would you like to submit?</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button 
                        type="button"
                        className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${subData.submissionType === 'text' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        onClick={() => setSubData({...subData, submissionType: 'text'})}
                      >
                        <AlignLeft size={16} /> Text
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

                  {subData.submissionType === 'link' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Project Link / GitHub URL</label>
                      <input required type="url" className="input-field" placeholder="https://..." value={subData.linkUrl} onChange={e => setSubData({...subData, linkUrl: e.target.value})} />
                    </div>
                  )}
                </>
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
