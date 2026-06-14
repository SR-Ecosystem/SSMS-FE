import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Award, FileCheck, Trophy, Sparkles, Rocket, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const MyGrades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGrades = async () => {
    try {
      const { data } = await axios.get(`/grades/student/${user._id}`);
      setGrades(data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrades(); }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Grades</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {grades.map(grade => {
          const score = grade.marksObtained;
          const max = grade.submissionId?.taskId?.maxMarks || 100;
          const percentage = (score / max) * 100;
          
          let encouragement = "Good Effort!";
          let Icon = Star;
          if (percentage >= 90) { encouragement = "Outstanding!"; Icon = Trophy; }
          else if (percentage >= 75) { encouragement = "Great Job!"; Icon = Sparkles; }
          else if (percentage >= 50) { encouragement = "Keep it up!"; Icon = Rocket; }

          return (
            <div key={grade._id} className="glass-panel overflow-hidden card-hover rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col">
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <span className="mb-2 drop-shadow-md text-white/90 flex justify-center"><Icon size={40} strokeWidth={1.5} /></span>
                  <div className="text-3xl font-black mb-2">{score} <span className="text-lg opacity-80 font-bold">/ {max}</span></div>
                  <h3 className="font-bold text-xs uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/10">{encouragement}</h3>
                </div>
              </div>
              <div className="p-5 text-center flex-1 flex flex-col">
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 mb-4 line-clamp-2">{grade.submissionId?.taskId?.title || 'Unknown Task'}</h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-700/50 flex-1">
                  <p className="text-xs font-bold text-emerald-500 mb-2 flex items-center gap-1.5"><FileCheck size={14}/> Saran Feedback</p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{grade.feedback}</p>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">Graded on {new Date(grade.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          );
        })}
        {grades.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <Award className="w-12 h-12 mb-3 text-slate-300" />
            <p>You haven't received any grades yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGrades;
