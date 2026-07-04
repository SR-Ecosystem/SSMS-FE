import { useState, useEffect } from 'react';
import axios from 'axios';
import { Gift, X, Sparkles, Star } from 'lucide-react';
import Swal from 'sweetalert2';

const DailyRewardsModal = ({ isOpen, onClose, onClaimed }) => {
  const [weekRewards, setWeekRewards] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);
  const [canClaim, setCanClaim] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Set default week rewards
      setWeekRewards([
        { day: 1, coins: 10, xp: 20 },
        { day: 2, coins: 15, xp: 30 },
        { day: 3, coins: 20, xp: 40 },
        { day: 4, coins: 25, xp: 50 },
        { day: 5, coins: 30, xp: 60 },
        { day: 6, coins: 40, xp: 80 },
        { day: 7, coins: 100, xp: 150 }
      ]);
    }
  }, [isOpen]);

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const { data } = await axios.post('/gamification/daily-login');
      setClaimedReward(data);
      setCurrentStreak(data.streak);
      setCanClaim(false);
      if (data.weekRewards) setWeekRewards(data.weekRewards);
      if (onClaimed) onClaimed(data);
    } catch (err) {
      if (err.response?.data?.alreadyClaimed) {
        setCanClaim(false);
      }
      const errMsg = err.response?.data?.message || 'Failed to claim daily reward.';
      Swal.fire({
        title: 'Claim Denied!',
        text: errMsg,
        icon: 'warning',
        confirmButtonColor: '#f97316',
        background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a'
      });
      console.error('Claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  const dayIndex = currentStreak > 0 ? ((currentStreak - 1) % 7) : 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50"></div>
          <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Gift size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Daily Login Reward</h2>
              <p className="text-sm text-white/80 font-medium">Day {currentStreak || '?'} of your streak!</p>
            </div>
          </div>
        </div>

        {/* Week Calendar */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-7 gap-2">
            {weekRewards.map((r, i) => {
              const isPast = i < dayIndex;
              const isToday = i === dayIndex && canClaim;
              const isClaimed = i === dayIndex && !canClaim && claimedReward;
              const isFuture = i > dayIndex;

              return (
                <div
                  key={i}
                  className={`relative flex flex-col items-center py-3 px-1 rounded-2xl border transition-all ${
                    isClaimed
                      ? 'bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-400/30'
                      : isToday
                      ? 'bg-amber-500/20 border-amber-500/50 ring-2 ring-amber-400/30 animate-pulse'
                      : isPast
                      ? 'bg-slate-700/30 border-slate-600/30'
                      : 'bg-slate-800/50 border-slate-700/30'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isClaimed ? 'text-emerald-400' : isToday ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    Day {i + 1}
                  </span>
                  <div className="text-lg mt-1">{i === 6 ? '🎁' : '🪙'}</div>
                  <span className={`text-xs font-bold mt-0.5 ${
                    isClaimed ? 'text-emerald-300' : isToday ? 'text-amber-300' : 'text-slate-400'
                  }`}>
                    +{r.coins}
                  </span>
                  {isPast && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-2xl">
                      <span className="text-emerald-400 text-lg">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Result */}
        {claimedReward && (
          <div className="px-6 pb-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <Sparkles className="mx-auto text-amber-400 mb-2" size={24} />
              <p className="text-emerald-300 font-bold text-sm">Reward Claimed!</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-amber-400 font-bold">+{claimedReward.coinsAwarded} 🪙</span>
                <span className="text-violet-400 font-bold">+{claimedReward.xpAwarded} XP</span>
              </div>
              {claimedReward.chestAwarded && (
                <p className="text-cyan-400 text-xs mt-2 font-bold">🎁 {claimedReward.chestAwarded} Chest Earned!</p>
              )}
              {claimedReward.leveledUp && (
                <p className="text-yellow-400 text-xs mt-1 font-bold animate-bounce">⭐ Level Up! → Level {claimedReward.newLevel}</p>
              )}
            </div>
          </div>
        )}

        {/* Claim Button */}
        <div className="px-6 pb-6">
          {canClaim ? (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-500/30 disabled:opacity-50 transition-all text-sm tracking-wide"
            >
              {claiming ? 'Claiming...' : '🎁 Claim Daily Reward'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-2xl transition-all text-sm"
            >
              Come back tomorrow!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyRewardsModal;
