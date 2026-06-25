import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';

const formatScore = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return String(Math.round((Number(val) + Number.EPSILON) * 100) / 100);
};

const StudentLeaderboard = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        let batchList = [];
        if (user?.role === 'admin') {
          const { data } = await axios.get('/batches');
          batchList = data.map(b => ({
            _id: b._id,
            batchId: b
          }));
        } else {
          const { data } = await axios.get('/enrollments/my');
          batchList = data;
        }
        setBatches(batchList);
        if (batchList.length > 0) {
          setSelectedBatch(batchList[0].batchId._id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
        setLoading(false);
      }
    };
    if (user) {
      fetchBatches();
    }
  }, [user]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedBatch) return;
      try {
        setLoading(true);
        const { data } = await axios.get(`/analytics/leaderboard/${selectedBatch}`);
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedBatch]);

  if (loading && !selectedBatch) return <Loader />;

  if (!loading && batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6">
          <Trophy size={40} className="text-rose-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">No Batch Assigned</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 text-lg">
          You are not currently enrolled in any active batch. Please join a batch to view the leaderboard.
        </p>
        <a href="/student/available-batches" className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/30 text-base">
          View Available Batches
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Trophy className="text-amber-300" size={32} />
            Batch Leaderboard
          </h1>
          <p className="text-indigo-100 mt-2 font-medium">Compete with your peers and maintain your streaks!</p>
        </div>
        <div className="relative z-10">
          <select 
            className="bg-white/20 border border-white/30 text-white rounded-xl px-4 py-2.5 outline-none font-medium appearance-none backdrop-blur-sm min-w-[200px]"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            {batches.map(b => (
              <option key={b._id} value={b.batchId._id} className="text-slate-900">{b.batchId.batchName}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : leaderboard.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-500 dark:text-slate-400 text-xs sm:text-sm uppercase tracking-wider">
                <div className="col-span-1 text-center">RANK</div>
                <div className="col-span-4">STUDENT</div>
                <div className="col-span-1 text-center">TASKS</div>
                <div className="col-span-2 text-center">LEETCODE</div>
                <div className="col-span-2 text-center">MOCK DRIVES</div>
                <div className="col-span-2 text-center">OVER ALL</div>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {leaderboard.map((student) => {
                  const isCurrentUser = student.studentId === user._id;
                  let rankIcon = null;
                  if (student.rank === 1) rankIcon = <Medal className="text-amber-400 drop-shadow-md" size={24} />;
                  else if (student.rank === 2) rankIcon = <Medal className="text-slate-300 drop-shadow-md" size={24} />;
                  else if (student.rank === 3) rankIcon = <Medal className="text-amber-600 drop-shadow-md" size={24} />;
     
                  return (
                    <div key={student.studentId} className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors ${isCurrentUser ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                      <div className="col-span-1 flex justify-center items-center">
                        {rankIcon ? rankIcon : <span className="font-black text-lg text-slate-400">{student.rank}</span>}
                      </div>
                      
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-bold truncate ${isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`} title={student.name}>
                            {student.name} {isCurrentUser && '(You)'}
                          </h3>
                          <div className="flex items-center gap-1 text-xs font-medium text-orange-500 mt-0.5">
                            <Flame size={12} fill="currentColor" />
                            <span>{student.leetcodeStreak} Day Streak</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {formatScore(student.totalTaskScore)}
                      </div>
    
                      <div className="col-span-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {formatScore(student.streakScore)}
                      </div>
     
                      <div className="col-span-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                        {formatScore(student.totalMockDriveScore || 0)}
                      </div>
                      
                      <div className="col-span-2 flex justify-center items-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-black">
                          {formatScore(student.overallScore)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
          <Award size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Leaderboard Data</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">There is no ranking data available for this batch yet.</p>
        </div>
      )}
    </div>
  );
};

export default StudentLeaderboard;
