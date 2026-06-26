import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Award, FileCheck, Trophy, Sparkles, Rocket, Star, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

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

const formatScore = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return String(Math.round((Number(val) + Number.EPSILON) * 100) / 100);
};

const MyGrades = () => {
  const [grades, setGrades] = useState([]);
  const [mockScores, setMockScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assignments'); // assignments, mockDrives
  const { user } = useAuth();
  const { themeColor, activeTheme } = useOutletContext();

  const fetchGradesData = async () => {
    try {
      const [gradesRes, mockRes] = await Promise.all([
        axios.get(`/grades/student/${user._id}`),
        axios.get(`/mock-drives/student/${user._id}`)
      ]);
      setGrades(gradesRes.data);
      setMockScores(mockRes.data);
    } catch (error) {
      console.error('Error fetching grades and mock scores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchGradesData(); 
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Academic Reports</h1>
          <p className="text-slate-500 mt-1 font-medium">Review your performance across assignments and mock placement drives</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center gap-1 max-w-max border border-slate-200 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'assignments' ? 'bg-white dark:bg-slate-950 text-theme-primary shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('mockDrives')}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'mockDrives' ? 'bg-white dark:bg-slate-950 text-theme-primary shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Mock Drives
          </button>
        </div>
      </div>
      
      {activeTab === 'assignments' ? (
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
                <div className="bg-gradient-to-br from-primary-400 to-theme-accent p-6 text-white text-center relative overflow-hidden">
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
                    <p className="text-xs font-bold text-theme-primary mb-2 flex items-center gap-1.5"><FileCheck size={14}/> Saran Feedback</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{grade.feedback}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">Graded on {formatDateTime(grade.createdAt)}</p>
                </div>
              </div>
            );
          })}
          {grades.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center glass-panel">
              <Award className="w-12 h-12 mb-3 text-slate-400" />
              <p className="font-bold text-lg text-slate-800 dark:text-slate-200">No grades yet</p>
              <p className="text-sm text-slate-500">Your task reviews will show up here once graded.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockScores.map(score => {
            const drive = score.mockDriveId;
            if (!drive) return null;

            return (
              <div key={score._id} className="glass-panel overflow-hidden card-hover rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col">
                <div className={`p-6 text-white text-center relative overflow-hidden ${score.attended ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-6 -mt-6 blur-xl"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="mb-2 drop-shadow-md text-white/90 flex justify-center">
                      {score.attended ? <CheckCircle2 size={40} strokeWidth={1.5} /> : <ShieldAlert size={40} strokeWidth={1.5} />}
                    </span>
                    <div className="text-3xl font-black mb-2">{formatScore(score.totalMarks)} <span className="text-lg opacity-80 font-bold">/ {drive.maxMarks}</span></div>
                    <h3 className="font-bold text-xs uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-white/10">
                      {score.attended ? `Grade: ${score.grade}` : 'ABSENT'}
                    </h3>
                  </div>
                </div>
                <div className="p-5 text-center flex-1 flex flex-col">
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 mb-4 line-clamp-2">{drive.title}</h4>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left border border-slate-100 dark:border-slate-700/50 flex-1 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-700 pb-1">Marks Breakdown</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-500 dark:text-slate-400 font-medium">MCQ Marks:</div>
                      <div className="font-bold text-right text-slate-800 dark:text-slate-200">{formatScore(score.mcq)}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Coding Round:</div>
                      <div className="font-bold text-right text-slate-800 dark:text-slate-200">{formatScore(score.coding)}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">Tech HR Marks:</div>
                      <div className="font-bold text-right text-slate-800 dark:text-slate-200">{formatScore(score.techHr)}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-medium">HR Marks:</div>
                      <div className="font-bold text-right text-slate-800 dark:text-slate-200">{formatScore(score.hr)}</div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">Percentage:</span>
                      <span className="font-black text-theme-primary">{formatScore(score.percentage)}%</span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">
                    Drive Date: {new Date(drive.date || drive.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
          {mockScores.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center glass-panel">
              <Award className="w-12 h-12 mb-3 text-slate-400" />
              <p className="font-bold text-lg text-slate-800 dark:text-slate-200">No mock drives yet</p>
              <p className="text-sm text-slate-500">Your placement mock drive reports will show up here once uploaded by admin.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyGrades;
