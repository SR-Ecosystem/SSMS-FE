import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'react-quill-new/dist/quill.snow.css';
import { FileText, CheckCircle, ExternalLink, Loader2, Link as LinkIcon, Download } from 'lucide-react';
import Loader from '../../components/Loader';

const SubmissionReviews = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState(null);
  const [gradeData, setGradeData] = useState({ marksObtained: '', feedback: '' });
  const [existingGradeId, setExistingGradeId] = useState(null);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');

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
      // Sort to show pending (ungraded) first
      const sorted = data.sort((a, b) => {
        if (a.status === 'submitted' && b.status !== 'submitted') return -1;
        if (a.status !== 'submitted' && b.status === 'submitted') return 1;
        return 0;
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
    setGradeData({ marksObtained: '', feedback: '' });
    setExistingGradeId(null);
    
    if (sub.status === 'graded') {
      setLoadingGrade(true);
      try {
        const { data } = await axios.get(`/grades/submission/${sub._id}`);
        if (data) {
          setGradeData({ marksObtained: data.marksObtained, feedback: data.feedback });
          setExistingGradeId(data._id);
        }
      } catch (error) {
        console.error('Error fetching grade:', error);
      } finally {
        setLoadingGrade(false);
      }
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
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Review Submissions</h1>
        <div className="relative">
          <select 
            className="input-field py-1.5 text-sm appearance-none min-w-[200px]"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map(sub => (
          <div key={sub._id} className="glass-panel p-6 card-hover flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 line-clamp-1">{sub.taskId?.title}</h3>
              <span className="text-xs bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-medium uppercase">{sub.submissionType || 'Legacy'}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">By: <span className="font-medium text-slate-700 dark:text-slate-300">{sub.studentId?.name}</span></p>
            
            <div className="space-y-2 mb-6 text-sm flex-1">
              <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-3 rounded-lg italic border border-slate-100 dark:border-white/10 line-clamp-3">"{sub.remarks || 'No remarks provided.'}"</p>
            </div>
            
            <div className="flex gap-2 mt-auto">
              {sub.status === 'resubmit' ? (
                <div className="w-full text-center py-2.5 font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  Re-submit Requested
                </div>
              ) : (
                <button 
                  onClick={() => openReviewModal(sub)}
                  className={`flex-1 py-2.5 shadow-md rounded-lg font-medium transition-colors ${sub.status === 'graded' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50' : 'btn-primary bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/20'}`}
                >
                  {sub.status === 'graded' ? 'Edit Grade' : 'Review & Grade'}
                </button>
              )}
            </div>
          </div>
        ))}
        {submissions.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 glass-panel">No submissions pending review.</div>
        )}
      </div>

      {activeReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {existingGradeId ? 'Edit Grade' : 'Review Submission'}
                  {activeReview.status === 'graded' && <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">GRADED</span>}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Student: {activeReview.studentId?.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleRequestResubmit(activeReview._id)} 
                  className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                  Request Re-submit
                </button>
                <button onClick={() => setActiveReview(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">&times;</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
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
                      const fileSrc = activeReview.fileUrl.startsWith('http') ? activeReview.fileUrl : `https://ssms-be.onrender.com${activeReview.fileUrl}`;
                      
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
                      const fileSrc = activeReview.fileUrl.startsWith('http') ? activeReview.fileUrl : `https://ssms-be.onrender.com${activeReview.fileUrl}`;
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
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setActiveReview(null)} className="flex-1 py-3 px-4 rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className={`flex-1 py-3 flex justify-center items-center gap-2 rounded-lg font-bold text-white transition-colors ${existingGradeId ? 'bg-emerald-600 hover:bg-emerald-700' : 'btn-primary'}`}>
                    <CheckCircle size={20}/> {existingGradeId ? 'Update Grade' : 'Submit Final Grade'}
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
