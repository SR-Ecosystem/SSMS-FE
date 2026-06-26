import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Code, Flame, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import Swal from 'sweetalert2';

const StudentLeetcode = () => {
  const { user, updateUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(true); // default to true

  // For active submissions directly from this page
  const [activeLinks, setActiveLinks] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const enrollRes = await axios.get('/enrollments/my');
        const approvedEnrollments = enrollRes.data.filter(e => e.status === 'approved');
        
        if (approvedEnrollments.length === 0) {
          setIsEnrolled(false);
          setLoading(false);
          return;
        }

        setIsEnrolled(true);
        const { data } = await axios.get('/leetcode/history');
        setHistory(data);
      } catch (error) {
        console.error('Error fetching leetcode history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSubmit = async (problemId) => {
    const linkToSubmit = activeLinks[problemId];
    if (!linkToSubmit) {
      return Swal.fire('Error', 'Please enter your solution link', 'error');
    }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/leetcode/${problemId}/submit`, { solutionLink: linkToSubmit });
      Swal.fire('Success', 'Solution submitted! Streak updated. 🔥', 'success');
      
      // Update local state context
      if (data.user) {
        updateUser({
          ...user,
          leetcodeStreak: data.user.leetcodeStreak,
          totalLeetcodeSubmissions: data.user.totalLeetcodeSubmissions
        });
      }
      
      // Update local state
      setHistory(prev => prev.map(p => 
        p._id === problemId ? { ...p, isSubmitted: true, solutionLink: linkToSubmit } : p
      ));
      setActiveLinks(prev => ({...prev, [problemId]: ''}));
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Could not submit solution', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonLoader type="card-grid" />;

  if (!isEnrolled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
          <Code size={40} className="text-rose-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">No Batch Assigned</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 text-lg">
          You are not currently enrolled in any active batch. Please join a batch to get access to LeetCode challenges.
        </p>
        <a href="/student/available-batches" className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/30 text-base">
          View Available Batches
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code className="text-orange-500" />
            LeetCode Challenges
          </h1>
          <p className="text-slate-500 mt-1">Track your daily programming challenges and streak</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Total Solved Counter */}
          <div className="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 rounded-2xl border border-primary-100 dark:border-primary-800/50 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-theme-primary">
              <CheckCircle size={24} className="text-theme-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-theme-primary uppercase tracking-wider">Total Solved</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {user?.totalLeetcodeSubmissions || 0} <span className="text-sm font-medium text-slate-500">Problems</span>
              </p>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 px-4 py-3 rounded-2xl border border-orange-100 dark:border-orange-800/50 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-500">
              <Flame size={24} className={user?.leetcodeStreak > 0 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-orange-400"} />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Current Streak</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                {user?.leetcodeStreak || 0} <span className="text-sm font-medium text-slate-500">Days</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Your Challenge History</h2>
        
        {history.length > 0 ? (
          <div className="space-y-8">
            {/* Active Challenges */}
            <div>
              <h3 className="text-md font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                Needs Attention
              </h3>
              {history.filter(p => !p.isSubmitted && new Date(p.deadline) >= new Date()).length > 0 ? (
                <div className="space-y-4">
                  {history.filter(p => !p.isSubmitted && new Date(p.deadline) >= new Date()).map(problem => (
                    <div 
                      key={problem._id} 
                      className="p-5 rounded-2xl border transition-all bg-slate-900 border-slate-800 shadow-xl shadow-orange-500/10"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-white">
                              {problem.title}
                            </h3>
                            <span className="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider border border-orange-500/30">
                              Active
                            </span>
                          </div>
                          <a 
                            href={problem.problemLink} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm flex items-center gap-1 w-fit hover:underline text-orange-400"
                          >
                            View Problem on LeetCode <ExternalLink size={14} />
                          </a>
                          <div className="text-xs mt-2 font-medium flex items-center gap-1 text-slate-400">
                            <Clock size={14} /> 
                            Deadline: {new Date(problem.deadline).toLocaleString()}
                          </div>
                        </div>

                        <div className="w-full md:w-auto md:min-w-[300px]">
                          <div className="flex gap-2 w-full">
                            <input 
                              type="url" 
                              placeholder="Paste solution link..." 
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                              value={activeLinks[problem._id] || ''}
                              onChange={(e) => setActiveLinks({...activeLinks, [problem._id]: e.target.value})}
                            />
                            <button 
                              onClick={() => handleSubmit(problem._id)}
                              disabled={submitting}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/30 whitespace-nowrap"
                            >
                              {submitting ? '...' : 'Submit'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No active challenges requiring your attention.</p>
                </div>
              )}
            </div>

            {/* Completed or Closed Challenges */}
            <div>
              <h3 className="text-md font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Past & Completed
              </h3>
              {history.filter(p => p.isSubmitted || new Date(p.deadline) < new Date()).length > 0 ? (
                <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
                  {history.filter(p => p.isSubmitted || new Date(p.deadline) < new Date()).map(problem => {
                    const isExpired = new Date(problem.deadline) < new Date();
                    return (
                      <div 
                        key={problem._id} 
                        className="p-5 rounded-2xl border transition-all bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                                {problem.title}
                              </h3>
                              {isExpired && !problem.isSubmitted && (
                                <span className="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                  Missed
                                </span>
                              )}
                            </div>
                            <a 
                              href={problem.problemLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-sm flex items-center gap-1 w-fit hover:underline text-primary-500 dark:text-primary-400"
                            >
                              View Problem on LeetCode <ExternalLink size={14} />
                            </a>
                            <div className="text-xs mt-2 font-medium flex items-center gap-1 text-slate-500">
                              <Clock size={14} /> 
                              Deadline: {new Date(problem.deadline).toLocaleString()}
                            </div>
                          </div>

                          <div className="w-full md:w-auto md:min-w-[300px]">
                            {problem.isSubmitted ? (
                              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50 rounded-xl p-3 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-sm">
                                  <CheckCircle size={18} />
                                  Solution Submitted
                                </div>
                                <a 
                                  href={problem.solutionLink} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline truncate block"
                                >
                                  {problem.solutionLink}
                                </a>
                              </div>
                            ) : (
                              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                                Submission Window Closed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-6 text-center border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No past challenges found.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Code size={48} className="mb-4 opacity-50 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Challenges Yet</h3>
            <p className="text-sm">Your batch hasn't been assigned any LeetCode challenges.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLeetcode;
