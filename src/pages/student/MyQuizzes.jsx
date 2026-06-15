import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Gamepad2, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import Loader from '../../components/Loader';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, attemptRes] = await Promise.all([
          axios.get('/quizzes'), // For student, this returns 'published done' and 'completed' quizzes for their batch
          axios.get('/quizzes/student-attempts')
        ]);
        setQuizzes(quizRes.data);
        setAttempts(attemptRes.data);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="text-emerald-500" />
            My Quizzes
          </h1>
          <p className="text-slate-500 mt-1">Complete your assigned quizzes to earn points.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            No quizzes available right now.
          </div>
        ) : (
          quizzes.map((quiz) => {
            const attempt = attempts.find(a => a.quizId?._id === quiz._id || a.quizId === quiz._id);
            const isCompleted = !!attempt;
            const questionCount = quiz.questions?.length || 0;

            return (
              <div key={quiz._id} className="glass-panel p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{quiz.title}</h3>
                  {isCompleted ? (
                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
                      <CheckCircle size={12} /> Done
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <Clock size={12} /> Active
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex-1">
                  Total Questions: {questionCount}
                </p>

                <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                  {isCompleted ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-500">Score</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {attempt.score} / {questionCount}
                      </span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => navigate(`/student/play-quiz/${quiz._id}`)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      Take Quiz <ArrowRight size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyQuizzes;
