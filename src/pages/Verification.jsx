import { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, CheckCircle, ExternalLink, Calendar, Code, Layout, GitBranch, Globe, Briefcase } from 'lucide-react';

const Verification = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!rollNumber) return;

    setLoading(true);
    setError('');
    setStudentData(null);

    try {
      // Create a temporary axios instance to avoid sending JWT token or triggering auth interceptors if possible
      // However, we just use the public endpoint
      const { data } = await axios.get(`/public/verify/${encodeURIComponent(rollNumber)}`);
      setStudentData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not find student records for this roll number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            Student Verification
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Verify student performance, grades, and completed tasks.
          </p>
          
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-8 relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={20} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-32 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm text-lg uppercase"
                placeholder="Enter student roll number..."
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-70 flex items-center"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify'}
              </button>
            </div>
            {error && <p className="text-rose-500 font-medium mt-3">{error}</p>}
          </form>
        </div>

        {/* Results */}
        {studentData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-800 shadow-md overflow-hidden shrink-0">
                {studentData.profile.profileImage ? (
                  <img src={studentData.profile.profileImage} alt={studentData.profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Search size={40} />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left space-y-4 w-full">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                    {studentData.profile.name}
                    <CheckCircle className="text-emerald-500" size={20} />
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">{studentData.profile.email}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  {studentData.profile.github && (
                    <a href={studentData.profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                      <GitBranch size={16} /> GitHub
                    </a>
                  )}
                  {studentData.profile.linkedin && (
                    <a href={studentData.profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      <Globe size={16} /> LinkedIn
                    </a>
                  )}
                  {studentData.profile.portfolio && (
                    <a href={studentData.profile.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                      <Briefcase size={16} /> Portfolio
                    </a>
                  )}
                </div>
              </div>
              
              {/* Attendance Quick Stat */}
              <div className="sm:ml-auto w-full sm:w-auto bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[140px]">
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">
                  {studentData.attendance.totalHoursLogged}<span className="text-lg text-slate-400 font-bold">h</span>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Logged Time</div>
                <div className="flex items-center gap-2 mt-2 text-xs font-medium">
                  <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{studentData.attendance.daysPresent} Days Present</span>
                </div>
              </div>
            </div>

            {/* Submissions & Quizzes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Tasks List */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col h-[500px]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Layout className="text-indigo-500" size={20} />
                  Completed Tasks ({studentData.tasks.length})
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {studentData.tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Layout size={40} className="mb-2 opacity-20" />
                      <p>No graded tasks found.</p>
                    </div>
                  ) : (
                    studentData.tasks.map((task, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">{task.taskTitle}</h4>
                          <span className="shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-lg text-xs font-bold ml-3">
                            {task.marksObtained} / {task.maxMarks}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-800 p-2 rounded-lg line-clamp-2">"{task.feedback}"</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-2">{new Date(task.submittedAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quizzes List */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col h-[500px]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Code className="text-emerald-500" size={20} />
                  Completed Quizzes ({studentData.quizzes.length})
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {studentData.quizzes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Code size={40} className="mb-2 opacity-20" />
                      <p>No quizzes found.</p>
                    </div>
                  ) : (
                    studentData.quizzes.map((quiz, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{quiz.quizTitle}</h4>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">{new Date(quiz.completedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/50 shrink-0">
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{quiz.score}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
            
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Verification;
