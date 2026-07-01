import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader';
import { Sparkles, Trophy, Award, ShoppingBag, Shirt } from 'lucide-react';

const GamificationShop = () => {
  const { userCoins, gamificationData, fetchCounts } = useOutletContext();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'badges'

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/gamification/shop');
      setCatalog(data);
    } catch (error) {
      console.error('Failed to load shop catalog:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load wardrobe catalog. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleUnlock = async (item) => {
    try {
      const result = await Swal.fire({
        title: `Unlock ${item.name}?`,
        html: `Would you like to unlock this avatar for <span class="text-amber-500 font-bold">${item.cost} 🪙</span>?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Unlock Avatar'
      });

      if (result.isConfirmed) {
        setLoading(true);
        const { data } = await axios.post('/gamification/shop/unlock', { itemId: item.id });
        
        // Refresh catalog & parent layout context
        await fetchCatalog();
        if (fetchCounts) fetchCounts();

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: data.message,
          confirmButtonColor: '#10b981'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Transaction Failed',
        text: error.response?.data?.message || 'Transaction failed. Check your coins.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (avatarUrl) => {
    try {
      setLoading(true);
      const { data } = await axios.post('/gamification/shop/equip', { avatarUrl });
      
      // Sync layout
      if (fetchCounts) fetchCounts();

      Swal.fire({
        icon: 'success',
        title: 'Avatar Equipped',
        text: data.message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Equip Failed',
        text: error.response?.data?.message || 'Failed to equip avatar.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && catalog.length === 0) {
    return <Loader text="Loading Wardrobe..." />;
  }

  // Pre-configured list of all possible badges in the system to render locked vs unlocked
  const ALL_SYSTEM_BADGES = [
    { name: 'Streak Rookie', icon: '🔥', description: 'Reach a LeetCode streak of 5 days' },
    { name: 'Streak Master', icon: '⚡', description: 'Reach a LeetCode streak of 15 days' },
    { name: 'LeetCode Warrior', icon: '⚔️', description: 'Solve 10 LeetCode problems' },
    { name: 'Elite Coder', icon: '👑', description: 'Solve 30 LeetCode problems' },
    { name: 'Rich Student', icon: '💰', description: 'Accumulate 500 coins' },
    { name: 'Shopaholic', icon: '🛍️', description: 'Unlock 5 or more avatars in the wardrobe shop' }
  ];

  const earnedBadgeNames = new Set((gamificationData?.badges || []).map(b => b.name));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-theme-primary to-theme-accent p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="animate-pulse" /> Student Wardrobe & Shop
            </h1>
            <p className="text-white/80 mt-2 max-w-xl text-sm font-medium">
              Complete coding challenges, submit tasks with high marks, and excel in mock drives to earn coins and customize your avatar!
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-inner flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">My Coins</span>
              <span className="text-3xl font-extrabold text-amber-300 mt-1 flex items-center gap-1">
                🪙 {userCoins}
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-inner flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">XP Level</span>
              <span className="text-3xl font-extrabold text-white mt-1">
                {gamificationData?.level || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Avatar Preview + Shop/Badges Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 text-center space-y-6 flex flex-col items-center relative overflow-hidden group">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-theme-primary/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-theme-accent/5 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
            
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 relative z-10">
              <Shirt size={20} className="text-theme-primary" /> Active Avatar
            </h2>

            {/* Large Avatar Rendering */}
            <div className="relative z-10 w-44 h-44 rounded-full border-4 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-xl overflow-hidden p-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <img 
                src={gamificationData?.equippedAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=default'} 
                alt="Equipped Avatar" 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2 w-full relative z-10">
              <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span>XP Progress</span>
                <span>{gamificationData?.points || 0} / {gamificationData?.nextLevelXP || 100} XP</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700">
                <div 
                  className="h-full bg-gradient-to-r from-theme-primary to-theme-accent rounded-full transition-all duration-500" 
                  style={{ width: `${gamificationData?.pct || 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium pt-1">
                Accumulate {(gamificationData?.nextLevelXP || 100) - (gamificationData?.points || 0)} more XP to level up!
              </p>
            </div>

            {/* Badges Preview on Card */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 w-full relative z-10">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 text-left">
                Equipped Badges ({gamificationData?.badges?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2 justify-start">
                {(gamificationData?.badges || []).length > 0 ? (
                  gamificationData.badges.map((badge, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700 shadow-sm text-xs font-bold"
                      title={badge.description}
                    >
                      <span>{badge.icon}</span>
                      <span className="text-slate-700 dark:text-slate-300">{badge.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-medium">No badges unlocked yet. Go to Leetcode or submit tasks to unlock!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Shop / Badges Tabbed Views */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-100 dark:border-slate-800 gap-4">
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 pb-4 font-bold text-sm transition-all relative cursor-pointer ${
                activeTab === 'shop'
                  ? 'text-theme-primary'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <ShoppingBag size={18} /> Avatar Catalog
              {activeTab === 'shop' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex items-center gap-2 pb-4 font-bold text-sm transition-all relative cursor-pointer ${
                activeTab === 'badges'
                  ? 'text-theme-primary'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Trophy size={18} /> Trophy Cabinet
              {activeTab === 'badges' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-primary rounded-full" />
              )}
            </button>
          </div>

          {activeTab === 'shop' ? (
            /* Shop Tab Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalog.map(item => {
                const isEquipped = gamificationData?.equippedAvatar === item.url;
                
                return (
                  <div 
                    key={item.id}
                    className={`glass-panel p-4 flex items-center justify-between gap-4 border transition-all ${
                      isEquipped 
                        ? 'ring-2 ring-theme-primary border-theme-primary/30 bg-theme-primary/5 dark:bg-theme-primary/10'
                        : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center p-1.5 shadow-sm">
                        <img src={item.url} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</h3>
                        <p className="text-[11px] text-slate-400 capitalize font-medium">{item.style} style</p>
                        
                        {!item.isUnlocked && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-extrabold">
                            <span>🪙</span>
                            <span>{item.cost} coins</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {item.isUnlocked ? (
                        isEquipped ? (
                          <span className="text-xs font-extrabold text-theme-primary bg-theme-primary/10 px-3 py-1.5 rounded-xl border border-theme-primary/20">
                            Equipped
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquip(item.url)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            Equip
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => handleUnlock(item)}
                          disabled={userCoins < item.cost}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            userCoins >= item.cost
                              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/10'
                              : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200/50 dark:border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Badges Tab View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALL_SYSTEM_BADGES.map((badge, idx) => {
                const isUnlocked = earnedBadgeNames.has(badge.name);
                
                return (
                  <div 
                    key={idx}
                    className={`glass-panel p-5 flex gap-4 items-start border transition-all relative overflow-hidden ${
                      isUnlocked 
                        ? 'border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/2 dark:bg-emerald-500/5 shadow-inner'
                        : 'opacity-50 grayscale bg-slate-100/10 dark:bg-slate-800/10'
                    }`}
                  >
                    {/* Badge Unlock Status Ribbon */}
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-bl-lg shadow-sm">
                        Unlocked
                      </div>
                    )}

                    {/* Big Badge Emoji Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md border ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border-emerald-500/30'
                        : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}>
                      {badge.icon}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                        {badge.name}
                        {isUnlocked && <Award size={14} className="text-emerald-500" />}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{badge.description}</p>
                      
                      {isUnlocked ? (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                          Earned on: {new Date(gamificationData?.badges?.find(b => b.name === badge.name)?.unlockedAt || new Date()).toLocaleDateString()}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold pt-1">
                          Locked
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamificationShop;
