import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, X, Loader2, Award } from 'lucide-react';

const QuizResultsModal = ({ quizId, quizTitle, onClose }) => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const { data } = await axios.get(`/quizzes/${quizId}/attempts`);
        setAttempts(data);
      } catch (error) {
        console.error('Error fetching attempts', error);
      } finally {
        setLoading(false);
      }
    };
    if (quizId) fetchAttempts();
  }, [quizId]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="glass-panel w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white leading-none">Leaderboard Results</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{quizTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 dark:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative z-10 flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-black/10">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">
              No attempts recorded for this quiz yet.
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt, idx) => (
                <div key={attempt._id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:scale-[1.02] transition-transform">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                    idx === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                    idx === 1 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' :
                    idx === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 dark:text-white text-lg">{attempt.studentId?.name || 'Unknown Student'}</h4>
                    <p className="text-xs font-medium text-slate-500">{attempt.studentId?.rollNumber || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-500">{attempt.score}</div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResultsModal;
