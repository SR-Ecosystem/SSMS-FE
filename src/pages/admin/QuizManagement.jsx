import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, Play, Loader2, Save, Trash, Clock, Upload, Download, BarChart2, RotateCcw, CheckCircle } from 'lucide-react';
import Loader from '../../components/Loader';
import QuizResultsModal from './QuizResultsModal';

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  
  const navigate = useNavigate();

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [batchId, setBatchId] = useState('');
  const [status, setStatus] = useState('draft');
  const [questions, setQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }
  ]);

  const fetchData = async () => {
    try {
      const [quizRes, batchRes] = await Promise.all([
        axios.get('/quizzes'),
        axios.get('/batches')
      ]);
      setQuizzes(quizRes.data);
      setBatches(batchRes.data);
      if (batchRes.data.length > 0) {
        setBatchId(batchRes.data[0]._id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setStatus('draft');
    setBatchId(batches.length > 0 ? batches[0]._id : '');
    setQuestions([{ text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }]);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setTitle(q.title);
    setBatchId(q.batchId?._id || q.batchId);
    setStatus(q.status);
    setQuestions(q.questions.length > 0 ? q.questions : [{ text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Quiz?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/quizzes/${id}`);
        fetchData();
        Swal.fire('Deleted!', 'Quiz has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Could not delete quiz.', 'error');
      }
    }
  };

  const handlePublish = async (id) => {
    try {
      await axios.put(`/quizzes/${id}`, { status: 'published' });
      fetchData();
      Swal.fire('Success', 'Quiz is now published and available to students!', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to publish quiz', 'error');
    }
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const newQ = [...questions];
    newQ[qIndex][field] = value;
    setQuestions(newQ);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex] = value;
    setQuestions(newQ);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: ['', '', '', ''], correctOption: 0, timeLimit: 20 }]);
  };

  const removeQuestion = (qIndex) => {
    if (questions.length === 1) return;
    const newQ = [...questions];
    newQ.splice(qIndex, 1);
    setQuestions(newQ);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) return Swal.fire('Error', 'Title is required', 'error');
    if (questions.some(q => !q.text.trim() || q.options.some(o => !o.trim()))) {
      return Swal.fire('Error', 'All questions and options must be filled', 'error');
    }

    const payload = { title, batchId, status, questions };

    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/quizzes/${editingId}`, payload);
        Swal.fire('Success', 'Quiz updated', 'success');
      } else {
        await axios.post('/quizzes', payload);
        Swal.fire('Success', 'Quiz created', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save quiz', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingExcel(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (editingId) {
        // Edit mode: uploads and adds directly to the quiz in the database
        const { data } = await axios.post(`/quizzes/${editingId}/upload-excel`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Success', data.message, 'success');
        setQuestions(data.quiz.questions);
        fetchData();
      } else {
        // Create mode: parses the excel and adds it to the local React state
        const { data } = await axios.post('/quizzes/parse-excel', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Success', data.message, 'success');
        
        let currentQs = [...questions];
        // If the only question is the default empty one, replace it
        if (currentQs.length === 1 && !currentQs[0].text.trim() && !currentQs[0].options[0].trim()) {
          currentQs = [];
        }
        
        setQuestions([...currentQs, ...data.questions]);
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to upload Excel', 'error');
    } finally {
      setUploadingExcel(false);
      e.target.value = null; // reset input
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Quizzes</h1>
          <p className="text-slate-500 mt-1">Create and publish quizzes for students</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/30">
          <Plus size={20} /> Create Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map(quiz => (
          <div key={quiz._id} className="glass-panel p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{quiz.title}</h3>
              <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                quiz.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                quiz.status === 'completed' ? 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' :
                'bg-amber-100 text-amber-700'
              }`}>
                {quiz.status.toUpperCase()}
              </span>
            </div>
            
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex-1">
              Batch: {quiz.batchId?.batchName} <br/>
              Questions: {quiz.questions?.length || 0}
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col gap-3">
              {/* Top row: Edit, Delete, Publish */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(quiz)} 
                    className="p-2 text-slate-400 hover:text-emerald-500 bg-slate-50 dark:bg-white/5 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(quiz._id)} 
                    className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-white/5 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {quiz.status !== 'published' && (
                  <button 
                    onClick={() => handlePublish(quiz._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-bold rounded-lg transition-all"
                    title="Make quiz available to students"
                  >
                    <CheckCircle size={14} /> Publish
                  </button>
                )}
              </div>

              {/* Bottom row: Primary Actions */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button 
                  onClick={() => {
                    setSelectedQuiz(quiz);
                    setShowResultsModal(true);
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all text-sm"
                >
                  <BarChart2 size={16} /> Results
                </button>
                
                <button 
                  onClick={() => navigate(`/host-quiz/${quiz._id}`)}
                  className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all text-sm"
                  title="Host a Live Game"
                >
                  <Play size={16} /> Host Live
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                {editingId ? 'Edit Quiz' : 'Create New Quiz'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-white/10 rounded-full transition-colors">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 dark:bg-black/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Quiz Title</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. JavaScript Fundamentals" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Batch</label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={batchId} onChange={e => setBatchId(e.target.value)}>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Status</label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Questions</h3>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <>
                      <a 
                        href="https://ssms-be.onrender.com/api/quizzes/template-excel" 
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Download size={16} /> Template
                      </a>
                      
                      <label className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold rounded-xl flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer">
                        {uploadingExcel ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} disabled={uploadingExcel} />
                      </label>
                    </>

                    <button type="button" onClick={addQuestion} className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-xl flex items-center gap-2 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                      <Plus size={16} /> Add Manual
                    </button>
                  </div>
                </div>

                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 relative">
                    <div className="absolute top-4 right-4">
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(qIndex)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash size={18} />
                        </button>
                      )}
                    </div>
                    
                    <div className="mb-6 pr-12">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Question {qIndex + 1}</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-medium text-lg" value={q.text} onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)} placeholder="Type your question here..." />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name={`correct-${qIndex}`} 
                            checked={q.correctOption === optIndex}
                            onChange={() => handleQuestionChange(qIndex, 'correctOption', optIndex)}
                            className="w-5 h-5 text-emerald-500 focus:ring-emerald-500"
                          />
                          <input 
                            required 
                            type="text" 
                            className={`flex-1 px-4 py-2 border rounded-xl focus:ring-2 outline-none transition-all dark:text-white ${q.correctOption === optIndex ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-500/50' : 'bg-slate-50 border-slate-200 dark:bg-black/20 dark:border-white/10 focus:border-emerald-500'}`} 
                            value={opt} 
                            onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)} 
                            placeholder={`Option ${optIndex + 1}`} 
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 max-w-xs">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Clock size={18} />
                        <span className="text-sm font-bold">Time Limit (s):</span>
                      </div>
                      <select 
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white font-medium"
                        value={q.timeLimit}
                        onChange={e => handleQuestionChange(qIndex, 'timeLimit', Number(e.target.value))}
                      >
                        <option value={10}>10 seconds</option>
                        <option value={20}>20 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>60 seconds</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </form>
            
            <div className="p-6 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-800 flex justify-end gap-4 rounded-b-2xl">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultsModal && selectedQuiz && (
        <QuizResultsModal 
          quizId={selectedQuiz._id} 
          quizTitle={selectedQuiz.title} 
          onClose={() => {
            setShowResultsModal(false);
            setSelectedQuiz(null);
          }} 
        />
      )}
    </div>
  );
};

export default QuizManagement;
