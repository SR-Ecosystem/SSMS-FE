import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'react-quill-new/dist/quill.snow.css';
import { FileText, CheckCircle, ExternalLink, Loader2, Link as LinkIcon, Download, RefreshCw, Zap, X } from 'lucide-react';
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

const SubmissionReviews = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState(null);
  const [gradeData, setGradeData] = useState({ marksObtained: '', feedback: '' });
  const [isLateSubmission, setIsLateSubmission] = useState(false);
  const [existingGradeId, setExistingGradeId] = useState(null);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState({ active: false, total: 0, completed: 0 });

  const handleAutoEvaluate = async () => {
    const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
    const pendingCount = pendingSubmissions.length;
    
    if (pendingCount === 0) {
      return Swal.fire('Info', 'There are no pending submissions to evaluate.', 'info');
    }

    const result = await Swal.fire({
      title: `Auto Evaluate ${pendingCount} Submissions?`,
      text: `This will automatically evaluate and grade ${pendingCount} pending submission(s). Submissions past the due date (11:59 PM) will lose 1 mark per hour delayed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, evaluate all'
    });

    if (result.isConfirmed) {
      setEvaluating(true);
      setEvalProgress({ active: true, total: pendingCount, completed: 0 });
      
      let successCount = 0;
      
      for (let i = 0; i < pendingCount; i++) {
        try {
          await axios.post('/grades/auto-evaluate', { submissionId: pendingSubmissions[i]._id });
          successCount++;
        } catch (error) {
          console.error('Error evaluating submission:', pendingSubmissions[i]._id, error);
        }
        setEvalProgress(prev => ({ ...prev, completed: i + 1 }));
      }
      
      setEvaluating(false);
      setEvalProgress({ active: false, total: 0, completed: 0 });
      fetchData();
      Swal.fire('Success', `Successfully auto-evaluated ${successCount} out of ${pendingCount} submissions.`, 'success');
    }
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    return url.split('.').pop().toLowerCase();
  };
  const isImage = (ext) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  const isPdf = (ext) => ext === 'pdf';
  const isText = (ext) => ['txt', 'csv', 'md'].includes(ext);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsRes, batchesRes] = await Promise.all([
        axios.get(`/submissions${selectedBatch ? `?batchId=${selectedBatch}` : ''}`),
        axios.get('/batches')
      ]);
      const data = submissionsRes.data;
      setBatches(batchesRes.data);
      // Sort to show pending (ungraded) first, and within pending sort oldest first
      const sorted = data.sort((a, b) => {
        if (a.status === 'submitted' && b.status !== 'submitted') return -1;
        if (a.status !== 'submitted' && b.status === 'submitted') return 1;
        
        // Both are pending: sort oldest first
        if (a.status === 'submitted' && b.status === 'submitted') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        
        // Both are graded: sort newest first
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setSubmissions(sorted);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedBatch]);

  const openReviewModal = async (sub) => {
    setActiveReview(sub);
    setExistingGradeId(null);
    setLoadingGrade(true);
    try {
      const [subRes, gradeRes] = await Promise.all([
        axios.get(`/submissions/${sub._id}`),
        axios.get(`/grades/submission/${sub._id}`).catch(() => null)
      ]);
      
      const fullSub = subRes.data;
      setActiveReview(fullSub);
      
      if (gradeRes && gradeRes.data) {
        const data = gradeRes.data;
        setGradeData({ marksObtained: data.marksObtained, feedback: data.feedback });
        setExistingGradeId(data._id);
      } else {
        setGradeData({ 
          marksObtained: fullSub.taskId?.maxMarks || '', 
          feedback: 'Good Work, Keep going...' 
        });
      }
      setIsLateSubmission(false);
    } catch (error) {
      console.error('Error opening review modal:', error);
      Swal.fire('Error', 'Could not fetch submission details.', 'error');
    } finally {
      setLoadingGrade(false);
    }
  };

  const handleRequestResubmit = async (submissionId) => {
    const result = await Swal.fire({
      title: 'Request Re-submit?',
      text: "The student will be allowed to submit this task again.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, request it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`/submissions/${submissionId}/resubmit`);
        Swal.fire('Success', 'Student has been notified to re-submit.', 'success');
        fetchData();
        setActiveReview(null);
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not request re-submit.', 'error');
      }
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    setSavingGrade(true);
    try {
      if (existingGradeId) {
        await axios.put(`/grades/${existingGradeId}`, gradeData);
        Swal.fire({ title: 'Updated!', text: 'Grade updated successfully.', icon: 'success' });
      } else {
        await axios.post('/grades', {
          submissionId: activeReview._id,
          ...gradeData
        });
        Swal.fire({ title: 'Graded!', text: 'Submission graded successfully.', icon: 'success' });
      }
      setActiveReview(null);
      setGradeData({ marksObtained: '', feedback: '' });
      setExistingGradeId(null);
      fetchData();
    } catch (error) {
      Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Error saving grade', icon: 'error' });
    } finally {
      setSavingGrade(false);
    }
  };

  if (loading) return <SkeletonLoader type="table" />;

  const filteredSubmissions = submissions.filter(sub => {
    const matchStatus = filterStatus === 'all' || sub.status === filterStatus;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      (sub.studentId?.name || '').toLowerCase().includes(searchLower) ||
      (sub.studentId?.email || '').toLowerCase().includes(searchLower) ||
      (sub.taskId?.title || '').toLowerCase().includes(searchLower);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white whitespace-nowrap flex-none">Review Submissions</h1>
        <div className="flex flex-nowrap items-center gap-3 overflow-x-auto custom-scrollbar pb-1 flex-1 md:justify-end">
          <input 
            type="text"
            placeholder="Search student or task..."
            className="input-field py-1.5 text-sm w-auto min-w-[150px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-1.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleAutoEvaluate}
            disabled={evaluating}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-bold rounded-xl border border-primary-200 dark:border-primary-800 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors shrink-0"
            title="Auto Evaluate All Pending Submissions"
          >
            {evaluating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            <span className="hidden sm:inline">Auto Evaluate</span>
          </button>

          <select 
            className="input-field py-1.5 text-sm w-auto min-w-[130px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending Review</option>
            <option value="graded">Graded</option>
            <option value="resubmit">Resubmit Requested</option>
          </select>
          <select 
            className="input-field py-1.5 text-sm w-auto min-w-[130px]"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">No submissions found matching criteria.</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden p-4">
              {filteredSubmissions.map(sub => (
                <div key={sub._id} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">{sub.studentId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{sub.studentId?.email}</div>
                    </div>
                    <div>
                      {sub.status === 'submitted' && <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full">PENDING</span>}
                      {sub.status === 'graded' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold rounded-full">GRADED</span>}
                      {sub.status === 'resubmit' && <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold rounded-full">RESUBMIT</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{sub.taskId?.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase flex items-center gap-2">
                      <span className="font-medium">{sub.submissionType || 'Legacy'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span>{formatDateTime(sub.submittedAt || sub.createdAt)}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end border-t border-slate-100 dark:border-white/10 pt-3">
                    {sub.status === 'resubmit' ? (
                      <span className="text-sm font-medium text-slate-400">Waiting for student</span>
                    ) : (
                      <button 
                        onClick={() => openReviewModal(sub)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm w-full sm:w-auto ${sub.status === 'graded' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                      >
                        {sub.status === 'graded' ? 'Edit Grade' : 'Review'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Student</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Task</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Date</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                    <th className="p-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map(sub => (
                    <tr key={sub._id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-100">{sub.studentId?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{sub.studentId?.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800 dark:text-slate-100 line-clamp-1 max-w-xs" title={sub.taskId?.title}>{sub.taskId?.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">{sub.submissionType || 'Legacy'}</div>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                        {formatDateTime(sub.submittedAt || sub.createdAt)}
                      </td>
                      <td className="p-4">
                        {sub.status === 'submitted' && <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full">PENDING</span>}
                        {sub.status === 'graded' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold rounded-full">GRADED</span>}
                        {sub.status === 'resubmit' && <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold rounded-full">RESUBMIT</span>}
                      </td>
                      <td className="p-4 text-right">
                        {sub.status === 'resubmit' ? (
                          <span className="text-sm font-medium text-slate-400">Waiting for student</span>
                        ) : (
                          <button 
                            onClick={() => openReviewModal(sub)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm ${sub.status === 'graded' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                          >
                            {sub.status === 'graded' ? 'Edit Grade' : 'Review'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Floating Progress Indicator */}
      {evalProgress.active && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-primary-200 dark:border-primary-800/50 p-4 z-50 flex items-center gap-4 transition-all duration-300 transform translate-y-0 opacity-100">
          <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Zap size={24} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Evaluating Submissions</h4>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-300 ease-out" 
                  style={{ width: `${(evalProgress.completed / evalProgress.total) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 min-w-[3ch]">{evalProgress.completed}/{evalProgress.total}</span>
            </div>
          </div>
        </div>
      )}

      {activeReview && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setActiveReview(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {existingGradeId ? 'Edit Grade' : 'Review Submission'}
                  {activeReview.status === 'graded' && <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">GRADED</span>}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Student: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeReview.studentId?.name}</span>
                  <span className="mx-2 opacity-50">•</span>
                  Submitted: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDateTime(activeReview.submittedAt || activeReview.createdAt)}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleRequestResubmit(activeReview._id)} 
                  className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors whitespace-nowrap"
                >
                  Request Re-submit
                </button>
                <button 
                  onClick={() => setActiveReview(null)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
              {loadingGrade && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                  <Loader2 className="animate-spin text-primary-500 mb-2" size={36} />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 animate-pulse">Loading submission details...</span>
                </div>
              )}
              
              {/* Submission Content Viewer */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-white/10">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Submitted Work</h4>
                
                {/* Type: Text */}
                {activeReview.submissionType === 'text' && (
                  <div 
                    className="text-slate-800 dark:text-slate-100 text-sm bg-white dark:bg-slate-900 p-6 rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-800 shadow-sm prose dark:prose-invert max-w-none ql-editor"
                    dangerouslySetInnerHTML={{ __html: activeReview.textContent || '<p class="text-slate-500">No text content submitted.</p>' }}
                  />
                )}

                {/* Type: File */}
                {activeReview.submissionType === 'file' && (
                  <div className="flex flex-col items-center justify-center gap-4">
                    {activeReview.fileUrl ? (() => {
                      const ext = getFileExtension(activeReview.fileUrl);
                      const fileSrc = activeReview.fileUrl.startsWith('http') ? activeReview.fileUrl : `${import.meta.env.VITE_API_URL}${activeReview.fileUrl}`;
                      
                      if (isImage(ext)) {
                        return (
                          <div className="w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 flex justify-center p-4">
                            <img src={fileSrc} alt="Submitted Work" className="max-w-full max-h-[500px] object-contain" />
                          </div>
                        );
                      } else if (isPdf(ext) || isText(ext)) {
                        return (
                          <div className="w-full h-96 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white">
                            <iframe src={fileSrc} className="w-full h-full" title="Submitted File" />
                          </div>
                        );
                      } else {
                        return (
                          <div className="w-full py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                            <FileText size={48} className="text-slate-400 mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 font-medium">Preview not available for .{ext} files</p>
                            <p className="text-sm text-slate-500 mt-1">Please download the file to view its contents.</p>
                          </div>
                        );
                      }
                    })() : (
                      <div className="py-6 text-center">
                        <FileText size={48} className="text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500">No file uploaded.</p>
                      </div>
                    )}
                    {activeReview.fileUrl && (() => {
                      const fileSrc = activeReview.fileUrl.startsWith('http') ? activeReview.fileUrl : `${import.meta.env.VITE_API_URL}${activeReview.fileUrl}`;
                      return (
                        <div className="flex items-center gap-4 mt-2">
                          <a 
                            href={fileSrc} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors w-max shadow-sm"
                          >
                            <ExternalLink size={18} /> Open in New Tab
                          </a>
                          <a 
                            href={fileSrc} 
                            download
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-6 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-max"
                          >
                            <Download size={18} /> Download
                          </a>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Type: Link */}
                {(activeReview.submissionType === 'link' || activeReview.githubLink || activeReview.liveLink) && (
                  <div className="flex flex-col gap-3">
                    {activeReview.linkUrl && (
                      <a href={activeReview.linkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:underline bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg w-full">
                        <LinkIcon size={18} /> {activeReview.linkUrl}
                      </a>
                    )}
                    {/* Fallbacks for older submissions */}
                    {activeReview.githubLink && (
                      <a href={activeReview.githubLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:underline bg-slate-100 dark:bg-slate-800 p-3 rounded-lg w-full">
                        <ExternalLink size={18} /> {activeReview.githubLink}
                      </a>
                    )}
                    {activeReview.liveLink && (
                      <a href={activeReview.liveLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-600 hover:underline bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg w-full">
                        <ExternalLink size={18} /> {activeReview.liveLink}
                      </a>
                    )}
                  </div>
                )}

                {/* Submitted Links (Multiple Links Feature) */}
                {activeReview.submittedLinks && activeReview.submittedLinks.length > 0 && (
                  <div className="flex flex-col gap-3 mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Submitted Links</p>
                    {activeReview.submittedLinks.map((sl, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg gap-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{sl.label}:</span>
                        {sl.url ? (
                          <a href={sl.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-semibold truncate max-w-md">
                            {sl.url} <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Not Provided</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Remarks */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Remarks</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm italic">{activeReview.remarks || 'None'}</p>
                </div>
              </div>

              {/* Grading Form */}
              <form onSubmit={handleGrade} className="space-y-4 pt-4 relative">
                {loadingGrade && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-sm rounded-lg">
                    <Loader2 className="animate-spin text-primary-500" size={32} />
                  </div>
                )}
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">{existingGradeId ? 'Edit Evaluation' : 'Evaluation Form'}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                      Marks Obtained <span className="text-xs text-slate-500 font-normal ml-1">(Max: {activeReview.taskId?.maxMarks})</span>
                    </label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      max={activeReview.taskId?.maxMarks} 
                      className="input-field font-mono text-lg font-bold text-primary-600" 
                      value={gradeData.marksObtained} 
                      onChange={e => setGradeData({...gradeData, marksObtained: Number(e.target.value)})} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Reviewer Feedback</label>
                  <textarea 
                    required 
                    className="input-field" 
                    rows="4" 
                    value={gradeData.feedback} 
                    onChange={e => setGradeData({...gradeData, feedback: e.target.value})} 
                    placeholder="Provide constructive feedback..."
                  ></textarea>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="lateSubmission"
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                    checked={isLateSubmission}
                    onChange={(e) => {
                      setIsLateSubmission(e.target.checked);
                      if (e.target.checked) {
                        setGradeData(prev => ({
                          ...prev,
                          feedback: prev.feedback === 'Good Work, Keep going...' 
                            ? 'Late submission. Marks have been reduced accordingly.' 
                            : 'Late submission. Marks have been reduced accordingly.\n\n' + prev.feedback
                        }));
                      } else {
                        setGradeData(prev => ({
                          ...prev,
                          feedback: prev.feedback.replace('Late submission. Marks have been reduced accordingly.\n\n', '')
                                                  .replace('Late submission. Marks have been reduced accordingly.', 'Good Work, Keep going...')
                        }));
                      }
                    }}
                  />
                  <label htmlFor="lateSubmission" className="text-sm font-medium text-rose-600 dark:text-rose-400 cursor-pointer">
                    Mark as Late Submission (Reduces Marks)
                  </label>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setActiveReview(null)} className="flex-1 py-3 px-4 rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" disabled={savingGrade} className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-lg font-bold text-white transition-colors ${existingGradeId ? 'bg-primary-600 hover:bg-primary-700' : 'btn-primary'}`}>
                    {savingGrade ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20}/>}
                    {savingGrade ? 'Saving...' : (existingGradeId ? 'Update Grade' : 'Submit Final Grade')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionReviews;
