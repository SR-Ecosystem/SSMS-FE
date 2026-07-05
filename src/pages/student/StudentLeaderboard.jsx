import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Award, Flame, Eye, Lock, Star, Heart, Shield } from 'lucide-react';
import Loader from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';

const formatScore = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return String(Math.round((Number(val) + Number.EPSILON) * 100) / 100);
};

const PET_EMOJIS = {
  Cat: '🐱',
  Dog: '🐶',
  Robot: '🤖',
  Dragon: '🐲',
  Panda: '🐼',
  Tiger: '🐯',
  Alien: '👽',
  Phoenix: '🔥',
  'Weekly Warrior Owl': '🦉'
};

const getBorderPreviewClass = (value) => {
  const map = {
    'bronze-glow': 'border-amber-700 shadow-[0_0_12px_rgba(180,83,9,0.5)]',
    'silver-pulse': 'border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.6)] animate-pulse',
    'gold-shimmer': 'border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.9)] bg-transparent',
    'diamond-sparkle': 'border-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.8)] animate-pulse duration-700',
    'fire-ring': 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.9)] bg-gradient-to-tr from-orange-500 to-red-600 animate-pulse',
    'lightning-arc': 'border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.95)] bg-gradient-to-tr from-violet-600 to-indigo-600 animate-pulse duration-500',
    'galaxy-swirl': 'border-pink-500 shadow-[0_0_35px_rgba(236,72,153,1)] bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-purple-600 animate-pulse duration-[2000ms]',
    'rainbow-spin': 'border-transparent shadow-[0_0_25px_rgba(16,185,129,0.8)] bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-yellow-500 animate-spin',
    'emerald-pulse': 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.8)] animate-pulse duration-1000',
    'ruby-fire': 'border-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.9)] animate-ping duration-[2000ms]',
    'nebula-cloud': 'border-indigo-400 shadow-[0_0_30px_rgba(129,140,248,0.9)] bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-pulse',
    'placement-ready': 'border-double border-4 border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,1)] animate-bounce duration-[2000ms]',
    'top-10-border': 'border-transparent bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_30px_rgba(6,182,212,0.9)] animate-pulse'
  };
  return map[value] || 'border-slate-500';
};

const getEffectStyles = (effectName) => {
  switch (effectName) {
    case 'fire-aura':
      return 'ring-2 ring-orange-500 ring-offset-1 shadow-[0_0_12px_#f97316] animate-pulse';
    case 'lightning-aura':
      return 'ring-2 ring-violet-500 ring-offset-1 shadow-[0_0_12px_#a855f7] animate-pulse';
    case 'galaxy-aura':
      return 'ring-2 ring-pink-500 ring-offset-1 shadow-[0_0_12px_#ec4899]';
    case 'sparkles':
      return 'ring-2 ring-yellow-400 ring-offset-1 shadow-[0_0_8px_#eab308]';
    case 'snowstorm':
      return 'ring-2 ring-sky-300 ring-offset-1 shadow-[0_0_8px_#38bdf8]';
    case 'heartbeat':
      return 'ring-2 ring-rose-500 ring-offset-1 shadow-[0_0_10px_#f43f5e]';
    case 'cyber-grid':
      return 'ring-2 ring-cyan-400 ring-offset-1 shadow-[0_0_12px_#22d3ee]';
    case 'perfect-attendance-aura':
      return 'ring-2 ring-amber-400 ring-offset-1 shadow-[0_0_15px_#f59e0b]';
    default:
      return '';
  }
};

const getNamecolorClass = (value) => {
  const classes = {
    'text-green-500': 'text-green-500',
    'text-blue-500': 'text-blue-500',
    'text-purple-500': 'text-purple-500',
    'text-amber-500': 'text-amber-500',
    'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500 font-extrabold': 'text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-green-500 to-blue-500 font-extrabold',
    'text-emerald-600 font-extrabold': 'text-emerald-600 font-extrabold',
    'text-red-500 font-bold animate-pulse': 'text-red-500 font-bold animate-pulse',
    'text-cyan-400 font-black animate-pulse': 'text-cyan-400 font-black animate-pulse',
    'text-indigo-400 font-extrabold': 'text-indigo-400 font-extrabold',
    'text-yellow-400 font-extrabold animate-bounce duration-[2000ms]': 'text-yellow-400 font-extrabold animate-bounce duration-[2000ms]'
  };
  return classes[value] || value || '';
};

const StudentLeaderboard = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Modal Compare states
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleViewProfile = async (studentId) => {
    setSelectedStudentId(studentId);
    setProfileModalOpen(true);
    setProfileLoading(true);
    setProfileData(null);
    try {
      const { data } = await axios.get(`/gamification/profile/${studentId}`);
      setProfileData(data);
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

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
                <div className="col-span-1 text-center">MOCKS</div>
                <div className="col-span-2 text-center">OVER ALL</div>
                <div className="col-span-1 text-center">ACTION</div>
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
                        {/* Avatar block with border & effect & pet */}
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                            student.profileBorder
                              ? `border-2 p-0.5 ${getBorderPreviewClass(student.profileBorder)}` 
                              : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                          } ${getEffectStyles(student.equippedEffect)}`}>
                            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                              {student.equippedAvatar ? (
                                <img 
                                  src={
                                    student.equippedAvatar.startsWith('/uploads')
                                      ? `${import.meta.env.VITE_API_URL || ''}${student.equippedAvatar}`
                                      : student.equippedAvatar
                                  } 
                                  alt={student.name} 
                                  className="w-full h-full object-cover object-top" 
                                />
                              ) : (
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{student.name.charAt(0)}</span>
                              )}
                            </div>
                          </div>
                          {student.equippedPet && (
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-750 rounded-full w-5 h-5 flex items-center justify-center text-[10px]" title={`Pet: ${student.equippedPet}`}>
                              {PET_EMOJIS[student.equippedPet] || '🐾'}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className={`font-bold truncate flex items-center gap-1.5 ${
                            student.currentNamecolor 
                              ? getNamecolorClass(student.currentNamecolor) 
                              : (isCurrentUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100')
                          }`} title={student.name}>
                            {student.name} {isCurrentUser && <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-1 py-0.2 rounded font-medium shrink-0">(You)</span>}
                          </h3>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {student.currentTitle && (
                              <div className="text-[9px] uppercase tracking-wider font-extrabold text-violet-400 dark:text-violet-300 animate-pulse">
                                🏆 {student.currentTitle}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-[11px] font-medium text-orange-500">
                                <Flame size={10} fill="currentColor" />
                                <span>{student.leetcodeStreak} Day Streak</span>
                              </div>
                              {student.badges && student.badges.length > 0 && (
                                <div className="flex items-center gap-0.5">
                                  {student.badges.slice(0, 3).map((b, i) => (
                                    <span key={i} className="text-xs" title={b.name}>{b.icon}</span>
                                  ))}
                                  {student.badges.length > 3 && (
                                    <span className="text-[10px] text-slate-400 font-bold">+{student.badges.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-1 text-center font-semibold text-slate-600 dark:text-slate-300 text-sm">
                        {formatScore(student.totalTaskScore)}
                      </div>
    
                      <div className="col-span-2 text-center font-semibold text-slate-600 dark:text-slate-300 text-sm">
                        {formatScore(student.streakScore)}
                      </div>
     
                      <div className="col-span-1 text-center font-semibold text-slate-600 dark:text-slate-300 text-sm">
                        {formatScore(student.totalMockDriveScore || 0)}
                      </div>
                      
                      <div className="col-span-2 flex justify-center items-center">
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-black text-sm">
                          {formatScore(student.overallScore)}
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-center items-center">
                        <button
                          onClick={() => handleViewProfile(student.studentId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:hover:bg-indigo-600 dark:hover:text-white dark:hover:border-indigo-600 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                          title="View detailed student profile"
                        >
                          <Eye size={12} />
                          <span className="hidden sm:inline">View</span>
                        </button>
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

      {/* Detailed Public Student Profile Preview Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header & Avatar Block (Static) */}
            <div className="relative shrink-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              {/* Cover Banner */}
              <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                <button
                  onClick={() => setProfileModalOpen(false)}
                  className="absolute top-4 right-4 bg-black/25 hover:bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer font-bold text-sm z-10"
                >
                  ✕
                </button>
              </div>

              {/* Avatar Overlay (centered and overlapping the banner boundary) */}
              <div className="flex flex-col items-center -mt-12 pb-4 px-6 relative z-10">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center relative shadow-xl ${
                    profileData?.profileBorder
                      ? `border-4 p-0.5 bg-white dark:bg-slate-800 ${getBorderPreviewClass(profileData.profileBorder)}` 
                      : 'border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900'
                  } ${getEffectStyles(profileData?.equippedEffect)}`}>
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800">
                      {profileData?.equippedAvatar ? (
                        <img 
                          src={
                            profileData.equippedAvatar.startsWith('/uploads')
                              ? `${import.meta.env.VITE_API_URL || ''}${profileData.equippedAvatar}`
                              : profileData.equippedAvatar
                          } 
                          alt={profileData.name} 
                          className="w-full h-full object-cover object-top" 
                        />
                      ) : (
                        <span className="text-3xl font-bold text-slate-400">{profileData?.name?.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  {profileData?.equippedPet && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-750 shadow-lg border border-slate-200 dark:border-slate-700 rounded-full w-7 h-7 flex items-center justify-center text-sm animate-bounce" title={`Pet: ${profileData.equippedPet}`}>
                      {PET_EMOJIS[profileData.equippedPet] || '🐾'}
                    </div>
                  )}
                </div>

                <h2 className={`text-xl font-black mt-2.5 text-center leading-tight ${profileData?.currentNamecolor ? getNamecolorClass(profileData.currentNamecolor) : 'text-slate-800 dark:text-white'}`}>
                  {profileData?.name}
                </h2>
                
                {profileData?.currentTitle && (
                  <span className="mt-1.5 inline-flex items-center text-[10px] uppercase tracking-wider font-extrabold px-3 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 shadow-sm animate-pulse">
                    🏆 {profileData.currentTitle}
                  </span>
                )}
              </div>
            </div>

            {/* Scrolling Stats and Achievements Content */}
            <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin space-y-5">
              {profileLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-xs font-semibold">Loading student profile details...</p>
                </div>
              ) : profileData ? (
                <div className="space-y-5">
                  
                  {/* Stats Grid */}
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2">Student Showcase</h4>
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Level */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg font-black shrink-0">
                          {profileData.level}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Level</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">{profileData.league} League</p>
                        </div>
                      </div>

                      {/* Coins */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg font-black shrink-0">
                          🪙
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Coins Balance</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">{profileData.coins} Coins</p>
                        </div>
                      </div>

                      {/* Leetcode Streak */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-lg font-black shrink-0">
                          🔥
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Leetcode Streak</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">{profileData.codingStreak} Days</p>
                        </div>
                      </div>

                      {/* Problems Solved */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-lg font-black shrink-0">
                          💻
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Submissions</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">{profileData.totalProblemsSolved} Solved</p>
                        </div>
                      </div>

                      {/* Unlocked Items */}
                      <div className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-3 col-span-2 hover:scale-[1.01] transition-transform">
                        <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center text-lg font-black shrink-0">
                          🛍️
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none">Purchased Cosmetics</p>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-1">{profileData.totalUnlockedItems} Shop Items Unlocked</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Badges and Achievements */}
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider mb-2">Earned Badges ({profileData.badges.length})</h4>
                    {profileData.badges.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                        No achievements unlocked yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                        {profileData.badges.map((badge, idx) => (
                          <div key={idx} className="p-2 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col items-center text-center shadow-sm hover:scale-105 hover:bg-slate-100/50 dark:hover:bg-slate-900/60 transition-all duration-200 cursor-default">
                            <span className="text-xl">{badge.icon || '🏅'}</span>
                            <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-300 mt-1 truncate w-full" title={badge.name}>
                              {badge.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Could not load profile. Please try again.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 flex justify-end shrink-0">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all hover:scale-[1.03] cursor-pointer"
              >
                Close Profile
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLeaderboard;
