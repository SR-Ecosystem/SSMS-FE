import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader';
import SpinWheel from '../../components/SpinWheel';
import TreasureChest from '../../components/TreasureChest';
import DailyRewardsModal from '../../components/DailyRewardsModal';
import {
  Sparkles, Trophy, ShoppingBag, RotateCw, Package, Crown,
  Palette, Star, Shield, Zap, Award, Gift, Flame, Target, History, Heart, Smile, Info,
  Users, UserPlus, Send
} from 'lucide-react';

const RARITY_COLORS = {
  Common:    { bg: 'bg-white dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-500 dark:text-slate-300', badge: 'bg-slate-500', glow: 'hover:shadow-slate-500/20' },
  Rare:      { bg: 'bg-blue-50/30 dark:bg-blue-950/25', border: 'border-blue-200 dark:border-blue-800/60', text: 'text-blue-600 dark:text-blue-300', badge: 'bg-blue-600', glow: 'hover:shadow-blue-500/40' },
  Epic:      { bg: 'bg-purple-50/30 dark:bg-purple-950/25', border: 'border-purple-200 dark:border-purple-800/60', text: 'text-purple-600 dark:text-purple-300', badge: 'bg-purple-600', glow: 'hover:shadow-purple-500/50' },
  Legendary: { bg: 'bg-amber-50/30 dark:bg-amber-950/25', border: 'border-amber-200 dark:border-amber-800/60', text: 'text-amber-600 dark:text-amber-300', badge: 'bg-amber-600', glow: 'hover:shadow-amber-500/60' },
  Mythic:    { bg: 'bg-rose-50/30 dark:bg-rose-950/25', border: 'border-rose-200 dark:border-rose-800/60', text: 'text-rose-600 dark:text-rose-300', badge: 'bg-rose-600', glow: 'hover:shadow-rose-500/70' }
};

const CATEGORY_ICONS = {
  avatar: <Crown size={18} />,
  border: <Shield size={18} />,
  title:  <Star size={18} />,
  theme:  <Palette size={18} />,
  effect: <Zap size={18} />,
  pet:    <Heart size={18} />,
  namecolor: <Palette size={18} />
};

const LEAGUE_ICONS = {
  Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎',
  Diamond: '💠', Master: '🏆', Grandmaster: '⚡', Legend: '👑'
};

const GamificationShop = () => {
  const { userCoins, gamificationData, fetchCounts } = useOutletContext();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shop');
  const [activeCategory, setActiveCategory] = useState('avatar');
  const [spinOpen, setSpinOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [achievements, setAchievements] = useState(null);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [streaks, setStreaks] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);
  const [friendRollInput, setFriendRollInput] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/gamification/shop?category=${activeCategory}`);
      setCatalog(data);
    } catch (error) {
      console.error('Failed to load shop:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  const fetchAchievements = async () => {
    try {
      const { data } = await axios.get('/gamification/achievements');
      setAchievements(data);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get('/gamification/reward-history?limit=30');
      setRewardHistory(data.events || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const fetchStreaks = async () => {
    try {
      const { data } = await axios.get('/gamification/streaks');
      setStreaks(data);
    } catch (err) {
      console.error('Failed to load streaks:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      setSocialLoading(true);
      const { data } = await axios.get('/gamification/friends');
      setFriends(data.friends || []);
      setPendingIncoming(data.pendingIncoming || []);
      setPendingOutgoing(data.pendingOutgoing || []);
    } catch (err) {
      console.error('Failed to load friends:', err);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!friendRollInput.trim()) return;
    try {
      setSocialLoading(true);
      const { data } = await axios.post('/gamification/friends/request', { rollNumber: friendRollInput });
      Swal.fire({ icon: 'success', title: 'Request Sent', text: data.message, timer: 2000, showConfirmButton: false });
      setFriendRollInput('');
      fetchFriends();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Request Failed', text: err.response?.data?.message || 'Failed to send request' });
    } finally {
      setSocialLoading(false);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      setSocialLoading(true);
      const { data } = await axios.post('/gamification/friends/respond', { requestId, action });
      Swal.fire({ icon: 'success', title: action === 'accept' ? 'Accepted!' : 'Declined', text: data.message, timer: 1500, showConfirmButton: false });
      fetchFriends();
      if (fetchCounts) fetchCounts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Action Failed', text: err.response?.data?.message || 'Failed to respond to request' });
    } finally {
      setSocialLoading(false);
    }
  };

  const handleShareCoins = async (friend) => {
    const { value: amount } = await Swal.fire({
      title: `Share Coins with ${friend.name}`,
      html: `<div class="text-center font-semibold text-slate-600 dark:text-slate-300">
               <p>Send a coins gift to ${friend.name}.</p>
               <p class="text-amber-500 font-bold mt-2">Available Coins: ${userCoins} 🪙</p>
             </div>`,
      input: 'number',
      inputPlaceholder: 'Enter amount to share',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Send gift',
      inputValidator: (value) => {
        if (!value || isNaN(value) || Number(value) <= 0) {
          return 'Please enter a valid positive coin amount.';
        }
        if (Number(value) > userCoins) {
          return 'You do not have enough coins!';
        }
      }
    });

    if (!amount) return;

    try {
      setSocialLoading(true);
      const { data } = await axios.post('/gamification/friends/share-coins', { friendId: friend.friendId, amount: Number(amount) });
      Swal.fire({ icon: 'success', title: 'Gift Sent!', text: data.message });
      fetchFriends();
      if (fetchCounts) fetchCounts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gift Failed', text: err.response?.data?.message || 'Failed to share coins' });
    } finally {
      setSocialLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'shop') fetchCatalog();
    else if (activeTab === 'achievements') fetchAchievements();
    else if (activeTab === 'history') fetchHistory();
    else if (activeTab === 'streaks') fetchStreaks();
    else if (activeTab === 'friends') fetchFriends();
  }, [activeTab, fetchCatalog]);

  const handleUnlock = async (item) => {
    if (level < (item.requiredLevel || 1)) {
      Swal.fire({
        icon: 'warning',
        title: 'Level Locked',
        text: `You must reach Level ${item.requiredLevel} to purchase this item. Keep earning XP by completing tasks!`,
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if ((userCoins || 0) < item.cost) {
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Coins',
        html: `<p class="text-sm">You need <b class="text-amber-500">${item.cost - (userCoins || 0)} 🪙</b> more to purchase <b>${item.name}</b>.</p><p class="text-[11px] text-gray-400 mt-2">Complete attendance, daily quizzes, and LeetCode problems to earn coins!</p>`,
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    const result = await Swal.fire({
      title: `Unlock ${item.name}?`,
      html: `<div class="text-center"><p>Cost: <b class="text-amber-500">${item.cost} 🪙</b></p><p class="text-sm text-gray-400 mt-1">Rarity: ${item.rarity}</p></div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Unlock'
    });
    if (!result.isConfirmed) return;

    try {
      await axios.post('/gamification/shop/unlock', { itemId: item._id });
      Swal.fire({ icon: 'success', title: `${item.name} unlocked!`, timer: 1500, showConfirmButton: false });
      fetchCatalog();
      if (fetchCounts) fetchCounts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
    }
  };

  const showItemInfo = (item) => {
    let explanation = '';
    if (item.achievementRequired) {
      explanation = `
        <div class="text-left space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>🏆 <b>Exclusive Reward:</b> This item cannot be bought with coins.</p>
          <p>🎯 <b>Requirement:</b> You must earn the <span class="font-bold text-indigo-500">${item.achievementRequired}</span> achievement badge.</p>
          <p class="text-xs text-slate-400">Achievements are awarded for milestones like top ranking in mock drives, attendance streaks, or completing tasks.</p>
        </div>
      `;
    } else if (item.requiredLevel > 1) {
      explanation = `
        <div class="text-left space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>⚡ <b>Level Lock:</b> This item is locked until you reach Level ${item.requiredLevel}.</p>
          <p>🎯 <b>How to unlock:</b> Earn XP by solving LeetCode problems, finishing assignments, and checking in daily to level up!</p>
        </div>
      `;
    } else if (item.cost === 0) {
      explanation = `
        <div class="text-left space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>🎉 <b>Free Item:</b> This item is unlocked by default for everyone!</p>
          <p>✨ Click the <b>Equip</b> button to apply it to your profile.</p>
        </div>
      `;
    } else {
      explanation = `
        <div class="text-left space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>🪙 <b>Shop Item:</b> Costs <span class="font-bold text-amber-500">${item.cost} Coins</span> to unlock.</p>
          <p>💡 <b>Earn Coins:</b> Complete daily attendance, daily quizzes, and solve LeetCode assignments to pile up coins!</p>
        </div>
      `;
    }

    Swal.fire({
      title: item.name,
      html: `
        <div class="space-y-4">
          <div class="flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl">
            <span class="text-xs font-bold text-white px-2 py-1 rounded-full ${RARITY_COLORS[item.rarity]?.badge || 'bg-slate-500'}">${item.rarity} ${item.category.toUpperCase()}</span>
          </div>
          <p class="text-xs italic text-slate-500 text-center">"${item.description || 'No description available'}"</p>
          <hr class="border-slate-200 dark:border-slate-700/50" />
          ${explanation}
        </div>
      `,
      confirmButtonText: 'Got it',
      confirmButtonColor: '#8b5cf6',
      background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a'
    });
  };

  const handleEquip = async (item) => {
    try {
      await axios.post('/gamification/shop/equip', { category: item.category, value: item.value });
      fetchCatalog();
      if (fetchCounts) fetchCounts();
    } catch (err) {
      console.error('Equip error:', err);
    }
  };

  const handleUnequip = async (item) => {
    try {
      await axios.post('/gamification/shop/equip', { category: item.category, value: '' });
      fetchCatalog();
      if (fetchCounts) fetchCounts();
    } catch (err) {
      console.error('Unequip error:', err);
    }
  };

  const handleBuyChest = async (chestType, cost) => {
    const result = await Swal.fire({
      title: `Buy ${chestType} Chest?`,
      html: `Spend <span class="text-amber-500 font-bold">${cost} 🪙</span> for a ${chestType} Chest?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Buy'
    });
    if (!result.isConfirmed) return;

    try {
      await axios.post('/gamification/buy-chest', { chestType });
      Swal.fire({ icon: 'success', title: `Chest purchased!`, text: `Check your inventory below to open it.`, timer: 2000, showConfirmButton: false });
      if (fetchCounts) fetchCounts();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to buy chest' });
    }
  };

  const level = gamificationData?.level || 1;
  const league = gamificationData?.league || 'Bronze';
  const pct = gamificationData?.pct || 0;
  const chests = gamificationData?.treasureChests || [];
  const canSpin = gamificationData?.canSpin;
  const canClaimDaily = gamificationData?.canClaimDailyLogin;

  const TABS = [
    { id: 'shop', label: 'Shop', icon: <ShoppingBag size={16} /> },
    { id: 'daily', label: 'Daily', icon: <Gift size={16} /> },
    { id: 'streaks', label: 'Streaks', icon: <Flame size={16} /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy size={16} /> },
    { id: 'friends', label: 'Friends', icon: <Users size={16} /> },
    { id: 'guide', label: 'How to Earn', icon: <Info size={16} /> },
    { id: 'history', label: 'History', icon: <History size={16} /> }
  ];

  const CATEGORIES = ['avatar', 'border', 'title', 'theme', 'effect', 'pet', 'namecolor'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-purple-500/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl -ml-12 -mb-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Sparkles className="text-amber-300" size={32} /> Gamification Hub
            </h1>
            <p className="text-purple-100 mt-2 font-medium">Earn rewards, unlock items, track your progress!</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-black">{level}</span>
              </div>
              <p className="text-xs text-purple-200 mt-1 font-bold">Level</p>
            </div>
            {/* League */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm text-3xl">
                {LEAGUE_ICONS[league] || '🥉'}
              </div>
              <p className="text-xs text-purple-200 mt-1 font-bold">{league}</p>
            </div>
            {/* Coins */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center backdrop-blur-sm">
                <span className="text-lg font-black text-amber-300">{userCoins}</span>
              </div>
              <p className="text-xs text-purple-200 mt-1 font-bold">Coins</p>
            </div>
          </div>
        </div>
        {/* XP Progress */}
        <div className="relative z-10 mt-4">
          <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
            <span>XP: {gamificationData?.xpInLevel || 0} / {gamificationData?.levelTargetXP || 100}</span>
            <span>Level {level} → {level + 1}</span>
          </div>
          <div className="w-full h-3 bg-purple-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1.5 flex flex-wrap gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.id === 'daily' && canClaimDaily && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'shop' && (
        <div className="space-y-4">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                  activeCategory === cat
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {CATEGORY_ICONS[cat]} {cat}s
              </button>
            ))}
          </div>

          {activeCategory === 'avatar' && (
            <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 shadow-sm">
              <span className="text-xl">🏆</span>
              <div>
                <h4 className="text-sm font-extrabold text-amber-500 dark:text-amber-400">Custom Profile Photo Privilege</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Only the <b>Top #1 student on the leaderboard</b> is allowed to upload and keep their own custom photo! Go to your <b>My Profile</b> page to upload yours once unlocked. All other ranks must buy/equip character avatars from the shop below.
                </p>
              </div>
            </div>
          )}

          {loading ? <Loader /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {catalog.map(item => {
                const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.Common;
                return (
                  <div key={item._id} className={`group relative rounded-2xl border ${rarity.border} ${rarity.bg} p-4 flex flex-col items-center transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl ${rarity.glow}`}>
                    {/* Rarity Badge */}
                    <span className={`absolute top-2 right-2 text-[9px] font-bold text-white px-2 py-0.5 rounded-full ${rarity.badge}`}>
                      {item.rarity}
                    </span>

                    {/* FREE Badge */}
                    {item.cost === 0 && item.isPurchasable !== false && (
                      <span className="absolute top-2 left-8 text-[9px] font-black text-white px-2 py-0.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 animate-pulse z-10">
                        FREE
                      </span>
                    )}

                    {/* Info Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); showItemInfo(item); }}
                      className="absolute top-2 left-2 w-5 h-5 rounded-full bg-white/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-violet-100 dark:hover:bg-violet-900/50 z-20"
                      title="How to get this item"
                    >
                      <Info size={12} className="text-violet-500" />
                    </button>

                    {/* Preview Wrapper */}
                    {['theme', 'effect', 'namecolor'].includes(item.category) ? (
                      <div className="w-full h-20 bg-slate-900/10 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center overflow-hidden my-2 rounded-2xl shadow-inner transition-colors group-hover:border-violet-500/30">
                        {item.category === 'theme' ? (
                          getThemePreviewComponent(item.value)
                        ) : item.category === 'effect' ? (
                          getEffectPreviewComponent(item.value)
                        ) : (
                          getNamecolorPreview(item)
                        )}
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-900/10 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center overflow-hidden my-2 shadow-inner transition-colors group-hover:border-violet-500/30">
                        {item.category === 'avatar' ? (
                          <img 
                            src={
                              (() => {
                                const path = item.imageUrl || item.value || '';
                                return (path.startsWith('/uploads') || path.startsWith('/api')) 
                                  ? `${import.meta.env.VITE_API_URL || ''}${path}` 
                                  : path;
                              })()
                            } 
                            alt={item.name} 
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" 
                          />
                        ) : item.category === 'border' ? (
                          <div className={`w-14 h-14 rounded-full border-3 ${getBorderPreviewClass(item.value)} transition-transform duration-300 group-hover:scale-110`}></div>
                        ) : item.category === 'title' ? (
                          <span className="text-xs font-bold text-center px-1 transition-transform duration-300 group-hover:scale-105">{item.value}</span>
                        ) : item.category === 'pet' ? (
                          <span className="text-3xl transition-transform duration-300 group-hover:scale-110">
                            {item.value === 'Cat' ? '🐱' : item.value === 'Dog' ? '🐶' : item.value === 'Robot' ? '🤖' : item.value === 'Dragon' ? '🐉' : item.value === 'Phoenix' ? '🔥' : item.value === 'Panda' ? '🐼' : item.value === 'Tiger' ? '🐯' : item.value === 'Alien' ? '👽' : item.value === 'Owl' ? '🦉' : '🐾'}
                          </span>
                        ) : (
                          <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{CATEGORY_ICONS[item.category]}</span>
                        )}
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-slate-800 dark:text-white text-center mt-1">{item.name}</h3>
                    {item.description && <p className="text-[10px] text-slate-500 text-center mt-0.5 line-clamp-2">{item.description}</p>}

                    {/* Level Req */}
                    {item.requiredLevel > 1 && (
                      <span className="text-[10px] text-violet-400 font-bold mt-1">Req. Level {item.requiredLevel}</span>
                    )}

                    {/* Actions */}
                    <div className="mt-auto pt-2 w-full">
                      {item.isEquipped ? (
                        <button
                          onClick={() => handleUnequip(item)}
                          className="w-full py-1.5 bg-emerald-500/20 hover:bg-red-500/20 text-emerald-400 hover:text-red-400 text-xs font-bold rounded-xl border border-emerald-500/30 hover:border-red-500/30 transition-colors group cursor-pointer"
                        >
                          <span className="group-hover:hidden">✓ Equipped</span>
                          <span className="hidden group-hover:inline">Unequip</span>
                        </button>
                      ) : item.isUnlocked ? (
                        <button
                          onClick={() => handleEquip(item)}
                          className="w-full py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-xs font-bold rounded-xl border border-violet-500/30 transition-colors"
                        >
                          Equip
                        </button>
                      ) : item.isPurchasable === false && item.cost === 0 ? (
                        <button
                          onClick={() => showItemInfo(item)}
                          className="w-full py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <Info size={12} /> How to Get
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlock(item)}
                          disabled={level < (item.requiredLevel || 1)}
                          className={`w-full py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                            item.cost === 0
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30'
                              : (userCoins || 0) < item.cost
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500/80 border-amber-500/20'
                                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {item.cost === 0 ? 'FREE' : `${item.cost} 🪙`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {catalog.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="font-bold">No items in this category yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'daily' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Login Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-2xl">🎁</div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Daily Login</h3>
                <p className="text-sm text-slate-500">Streak: {gamificationData?.dailyLoginStreak || 0} days</p>
              </div>
            </div>
            <button
              onClick={() => setDailyOpen(true)}
              disabled={!canClaimDaily}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                canClaimDaily
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:from-amber-400 hover:to-orange-400 cursor-pointer'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {canClaimDaily
                ? '🎁 Claim Daily Reward'
                : (gamificationData?.hasCheckedInToday
                    ? '✓ Claimed Today'
                    : '🔒 Check In Today First')}
            </button>
          </div>

          {/* Spin Wheel Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-2xl">🎰</div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Spin Wheel</h3>
                <p className="text-sm text-slate-500">Tickets: {gamificationData?.spinTickets || 0}</p>
              </div>
            </div>
            <button
              onClick={() => setSpinOpen(true)}
              disabled={!canSpin}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                canSpin
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-purple-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {canSpin ? '🎰 Spin Now!' : '⏰ Come Back Tomorrow'}
            </button>
          </div>

          {/* Treasure Chests */}
          {chests.length > 0 && (
            <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center text-2xl">📦</div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Treasure Chests</h3>
                  <p className="text-sm text-slate-500">{chests.length} unopened</p>
                </div>
              </div>
              <TreasureChest chests={chests} onChestOpened={() => { if (fetchCounts) fetchCounts(); }} />
            </div>
          )}

          {/* Mystery Chest Shop */}
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-amber-500" /> Mystery Chest Shop
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { type: 'Bronze', cost: 100, icon: '📦', color: 'text-amber-700 dark:text-amber-600' },
                { type: 'Silver', cost: 500, icon: '🗃️', color: 'text-slate-400 dark:text-slate-300' },
                { type: 'Gold', cost: 1500, icon: '📥', color: 'text-yellow-500 dark:text-yellow-400' },
                { type: 'Legendary', cost: 5000, icon: '👑', color: 'text-purple-500 dark:text-purple-400' }
              ].map((chest) => (
                <div key={chest.type} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all hover:scale-[1.02] hover:shadow-md">
                  <span className="text-3xl mb-1">{chest.icon}</span>
                  <span className={`text-sm font-extrabold ${chest.color}`}>{chest.type}</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-bold">Cost: {chest.cost} 🪙</p>
                  <button
                    onClick={() => handleBuyChest(chest.type, chest.cost)}
                    disabled={(userCoins || 0) < chest.cost}
                    className="w-full mt-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-700 disabled:text-slate-400 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Buy Chest
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'streaks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Login Streak */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg text-center">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{streaks?.dailyLoginStreak || 0}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1">Daily Login Streak</p>
          </div>
          {/* Coding Streak */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg text-center">
            <div className="text-4xl mb-2">🔥</div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{streaks?.codingStreak || 0}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1">Coding Streak</p>
            <p className="text-xs text-violet-400 mt-1">Best: {streaks?.maxCodingStreak || 0} days</p>
          </div>
          {/* Attendance Streak */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg text-center">
            <div className="text-4xl mb-2">⏰</div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{streaks?.attendanceStreak || 0}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1">Attendance Streak</p>
          </div>

          {/* Coding Milestones */}
          <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Target size={20} className="text-violet-500" /> Coding Streak Milestones
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(streaks?.codingMilestones || []).map((m, i) => {
                const reached = (streaks?.codingStreak || 0) >= m.days;
                return (
                  <div key={i} className={`rounded-2xl border p-3 text-center transition-all ${
                    reached ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                  }`}>
                    <p className={`text-2xl font-black ${reached ? 'text-emerald-400' : 'text-slate-400'}`}>{m.days}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Days</p>
                    <p className={`text-xs font-bold mt-1 ${reached ? 'text-emerald-400' : 'text-amber-500'}`}>+{m.coins} 🪙</p>
                    {reached && <span className="text-emerald-400 text-sm">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && achievements && (
        <div className="space-y-4">
          {/* Completion Header */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg flex items-center gap-6">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                  fill="none" stroke="#334155" strokeWidth="3" />
                <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                  fill="none" stroke="#a78bfa" strokeWidth="3"
                  strokeDasharray={`${achievements.completionPct}, 100`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-violet-400">
                {achievements.completionPct}%
              </span>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Achievement Progress</h3>
              <p className="text-slate-500">{achievements.totalUnlocked} / {achievements.totalAchievements} unlocked</p>
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {achievements.achievements.map((a, i) => {
              const rarity = RARITY_COLORS[a.rarity] || RARITY_COLORS.Common;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 text-center transition-all ${
                    a.unlocked
                      ? `${rarity.bg} ${rarity.border}`
                      : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50 opacity-50'
                  }`}
                  title={a.description}
                >
                  <span className="text-3xl">{a.icon}</span>
                  <p className={`text-xs font-bold mt-2 ${a.unlocked ? rarity.text : 'text-slate-500'}`}>{a.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{a.description}</p>
                  {a.unlocked && a.unlockedAt && (
                    <p className="text-[9px] text-emerald-500 mt-1 font-medium">
                      {new Date(a.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                  {a.isSecret && !a.unlocked && (
                    <span className="inline-block mt-1 text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-bold">SECRET</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Main Friends Header & Search Request Form */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={22} className="text-violet-500" /> Friends Directory
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Connect with your classmates using their Roll Number to share coins and check out their profile achievements.
                </p>
              </div>
              <form onSubmit={handleSendRequest} className="w-full md:w-auto flex items-center gap-2">
                <div className="relative flex-1 md:w-72">
                  <UserPlus className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={friendRollInput}
                    onChange={(e) => setFriendRollInput(e.target.value)}
                    placeholder="Enter Friend's Roll Number..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={socialLoading || !friendRollInput.trim()}
                  className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-500/20 shrink-0 cursor-pointer"
                >
                  Add Friend
                </button>
              </form>
            </div>
          </div>

          {/* Pending Invites Section */}
          {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Incoming requests */}
              {pendingIncoming.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    📥 Pending Friend Requests ({pendingIncoming.length})
                  </h4>
                  <div className="space-y-3">
                    {pendingIncoming.map((req) => (
                      <div key={req.requestId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <img src={req.avatar || '/avatars/jerry.png'} alt={req.name} className="w-10 h-10 rounded-full border-2 border-violet-400 bg-slate-200" />
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{req.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{req.rollNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespondRequest(req.requestId, 'accept')}
                            disabled={socialLoading}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 disabled:opacity-40 shrink-0 cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondRequest(req.requestId, 'reject')}
                            disabled={socialLoading}
                            className="px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 disabled:opacity-40 shrink-0 cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing requests */}
              {pendingOutgoing.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    📤 Sent Requests ({pendingOutgoing.length})
                  </h4>
                  <div className="space-y-3">
                    {pendingOutgoing.map((req) => (
                      <div key={req.requestId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <img src={req.avatar || '/avatars/jerry.png'} alt={req.name} className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200" />
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{req.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{req.rollNumber}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                          Pending...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Friends List Grid */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-extrabold text-slate-900 dark:text-white">
                My Friends ({friends.length})
              </h4>
              <p className="text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full font-bold">
                ⚠️ Weekly limit: Share coins once per week.
              </p>
            </div>

            {friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.friendId} className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl transition-all hover:shadow-md hover:scale-[1.01]">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={friend.avatar || '/avatars/jerry.png'} alt={friend.name} className="w-12 h-12 rounded-full border-2 border-violet-500/30 bg-slate-200" />
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">{friend.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{friend.rollNumber}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-black">Lvl {friend.level}</span>
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-black">{friend.league}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleShareCoins(friend)}
                      disabled={socialLoading || userCoins <= 0}
                      className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send size={12} /> Share Coins
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-bold">You haven't added any friends yet.</p>
                <p className="text-xs text-slate-400 mt-1">Enter a Roll Number in the search bar above to get started!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Intro Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles size={22} className="text-amber-500" /> Student Earning Guide
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Welcome to the Gamification system! Below is a complete breakdown of how you earn coins and XP, daily caps, and special milestone multipliers. Keep coding, attend classes, and climb the leaderboard!
            </p>
          </div>

          {/* Grid of Core Ways to Earn */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl shadow-sm text-center">
              <span className="text-3xl">📅</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white mt-2">Daily Attendance</h4>
              <p className="text-sm text-amber-500 font-black mt-1">+10 🪙 Coins</p>
              <p className="text-sm text-violet-400 font-black">+20 ⚡ XP</p>
              <p className="text-xs text-slate-400 mt-2">Awarded automatically on checking in for attendance daily.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl shadow-sm text-center">
              <span className="text-3xl">💻</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white mt-2">LeetCode Problems</h4>
              <p className="text-sm text-amber-500 font-black mt-1">+40 🪙 Coins</p>
              <p className="text-sm text-violet-400 font-black">+100 ⚡ XP</p>
              <p className="text-xs text-slate-400 mt-2">Per problem solved. Syncs directly from your LeetCode account daily.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl shadow-sm text-center">
              <span className="text-3xl">✍️</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white mt-2">Assignment Grades</h4>
              <p className="text-sm text-amber-500 font-black mt-1">Up to +250 🪙 Coins</p>
              <p className="text-sm text-violet-400 font-black">Up to +500 ⚡ XP</p>
              <p className="text-xs text-slate-400 mt-2">Based on grades. Project tasks scale up to +2500 🪙 / +5000 ⚡!</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 rounded-3xl shadow-sm text-center">
              <span className="text-3xl">🎁</span>
              <h4 className="font-extrabold text-slate-900 dark:text-white mt-2">Daily Login Cycle</h4>
              <p className="text-sm text-amber-500 font-black mt-1">Varies Daily</p>
              <p className="text-sm text-violet-400 font-black">10-100 XP / Coins</p>
              <p className="text-xs text-slate-400 mt-2">Claim every day you attend check-in. Day 7 awards a free Silver Chest!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mock Drive Scoring Guide */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg lg:col-span-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" /> Mock Drive Performance Rewards
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-bold">
                      <th className="py-2">Letter Grade</th>
                      <th className="py-2">Coins Reward</th>
                      <th className="py-2">XP Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-medium text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-2 text-emerald-400 font-bold">S+ Grade (&gt;=950 marks)</td>
                      <td className="py-2 text-amber-500 font-bold">+1200 🪙</td>
                      <td className="py-2 text-violet-400 font-bold">+2500 ⚡</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-emerald-400 font-bold">S Grade (900-949)</td>
                      <td className="py-2 text-amber-500 font-bold">+1000 🪙</td>
                      <td className="py-2 text-violet-400 font-bold">+2200 ⚡</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-cyan-400 font-bold">A+ Grade (850-899)</td>
                      <td className="py-2 text-amber-500 font-bold">+850 🪙</td>
                      <td className="py-2 text-violet-400 font-bold">+1900 ⚡</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-cyan-400 font-bold">A Grade (800-849)</td>
                      <td className="py-2 text-amber-500 font-bold">+700 🪙</td>
                      <td className="py-2 text-violet-400 font-bold">+1700 ⚡</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-purple-400">B Grade (700-799)</td>
                      <td className="py-2 text-amber-500">+500 🪙</td>
                      <td className="py-2 text-violet-400">+1300 ⚡</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-500 dark:text-slate-400">C Grade (600-699)</td>
                      <td className="py-2 text-amber-500">+350 🪙</td>
                      <td className="py-2 text-violet-400">+900 ⚡</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-500 dark:text-slate-400">D Grade (500-599)</td>
                      <td className="py-2 text-amber-500">+200 🪙</td>
                      <td className="py-2 text-violet-400">+600 ⚡</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-500 dark:text-slate-400 text-xs">Participation / Absence</td>
                      <td className="py-2 text-amber-500">+100 🪙</td>
                      <td className="py-2 text-violet-400">+300 ⚡</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Limits & Cap Rules */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Shield size={20} className="text-red-500" /> Fair Play & Daily Caps
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  To prevent abuse, daily base earnings for regular tasks and attendance are subject to cap limits:
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Daily Coins Cap</span>
                    <span className="text-xs font-black text-amber-500">300 🪙 / day</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Daily XP Cap</span>
                    <span className="text-xs font-black text-violet-400">700 ⚡ / day</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 bg-amber-500/5 p-3 rounded-2xl border border-amber-500/20">
                <p className="text-[11px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  🌟 Cap Bypasses
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Streak milestones, project grading, and mock tests <b>always bypass daily limits</b>. You will never lose high-value milestone rewards!
                </p>
              </div>
            </div>
          </div>

          {/* Complete League Ranking Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-lg">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Award size={20} className="text-indigo-500" /> League & Ranking Progression
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Your league is based on your level. Climb through the leagues by earning XP and leveling up!</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { league: 'Bronze', icon: '🥉', levels: '1 – 4', xp: '0 – 1,999', color: 'from-amber-800/20 to-orange-900/20', border: 'border-amber-700/40', text: 'text-amber-600 dark:text-amber-400', glow: '' },
                { league: 'Silver', icon: '🥈', levels: '5 – 8', xp: '2,000 – 7,999', color: 'from-slate-300/20 to-slate-400/20', border: 'border-slate-400/40', text: 'text-slate-500 dark:text-slate-300', glow: '' },
                { league: 'Gold', icon: '🥇', levels: '9 – 12', xp: '8,000 – 17,999', color: 'from-yellow-400/20 to-amber-500/20', border: 'border-yellow-500/40', text: 'text-yellow-600 dark:text-yellow-400', glow: 'shadow-yellow-500/10' },
                { league: 'Platinum', icon: '💎', levels: '13 – 16', xp: '18,000 – 31,999', color: 'from-teal-400/20 to-cyan-500/20', border: 'border-teal-400/40', text: 'text-teal-500 dark:text-teal-400', glow: 'shadow-teal-500/10' },
                { league: 'Diamond', icon: '💠', levels: '17 – 20', xp: '32,000 – 49,999', color: 'from-cyan-400/20 to-blue-500/20', border: 'border-cyan-400/40', text: 'text-cyan-500 dark:text-cyan-400', glow: 'shadow-cyan-400/15' },
                { league: 'Master', icon: '🏆', levels: '21 – 25', xp: '50,000 – 74,999', color: 'from-violet-500/20 to-purple-600/20', border: 'border-violet-500/40', text: 'text-violet-500 dark:text-violet-400', glow: 'shadow-violet-500/15' },
                { league: 'Grandmaster', icon: '⚡', levels: '26 – 30', xp: '75,000 – 99,999', color: 'from-rose-500/20 to-pink-600/20', border: 'border-rose-500/40', text: 'text-rose-500 dark:text-rose-400', glow: 'shadow-rose-500/15' },
                { league: 'Legend', icon: '👑', levels: '31+', xp: '100,000+', color: 'from-yellow-300/30 via-amber-400/25 to-orange-500/20', border: 'border-yellow-400/50', text: 'text-yellow-500 dark:text-yellow-300', glow: 'shadow-yellow-400/20 shadow-lg' },
              ].map((l, i) => {
                const currentLeague = gamificationData?.league || 'Bronze';
                const isCurrent = currentLeague === l.league;
                return (
                  <div key={l.league} className={`relative rounded-2xl border p-4 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] ${l.border} bg-gradient-to-br ${l.color} ${l.glow} ${isCurrent ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-800 scale-[1.02]' : ''}`}>
                    {isCurrent && (
                      <span className="absolute -top-2 right-2 text-[8px] font-black text-white bg-indigo-500 px-2 py-0.5 rounded-full shadow-md shadow-indigo-500/30 animate-pulse">YOU</span>
                    )}
                    <span className="text-3xl mb-1">{l.icon}</span>
                    <h4 className={`text-sm font-extrabold ${l.text}`}>{l.league}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-1">Levels {l.levels}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{l.xp} XP</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={20} className="text-slate-400" /> Reward History
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[600px] overflow-y-auto">
            {rewardHistory.length > 0 ? rewardHistory.map((e, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{e.reason}</p>
                  <p className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  {e.coinsChange !== 0 && (
                    <span className={`text-sm font-bold ${e.coinsChange > 0 ? 'text-amber-500' : 'text-red-400'}`}>
                      {e.coinsChange > 0 ? '+' : ''}{e.coinsChange} 🪙
                    </span>
                  )}
                  {e.xpChange !== 0 && (
                    <span className={`text-sm font-bold ${e.xpChange > 0 ? 'text-violet-500' : 'text-red-400'}`}>
                      {e.xpChange > 0 ? '+' : ''}{e.xpChange} XP
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-500">
                <History size={32} className="mx-auto mb-3 opacity-40" />
                <p className="font-bold">No reward history yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <SpinWheel isOpen={spinOpen} onClose={() => setSpinOpen(false)} canSpin={canSpin} onSpun={() => { if (fetchCounts) fetchCounts(); }} />
      <DailyRewardsModal isOpen={dailyOpen} onClose={() => setDailyOpen(false)} onClaimed={() => { if (fetchCounts) fetchCounts(); }} />
    </div>
  );
};

// Helper for border preview
function getBorderPreviewClass(value) {
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
    'top-10-border': 'border-transparent bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_30px_rgba(6,182,212,0.9)] animate-pulse',
    'frozen-frost': 'border-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.8)] animate-pulse bg-gradient-to-tr from-sky-400 to-blue-500',
    'shadow-assassin': 'border-purple-950 shadow-[0_0_20px_rgba(88,28,135,0.7)] bg-gradient-to-tr from-zinc-950 via-purple-950 to-zinc-900 animate-pulse duration-[3000ms]',
    'weekly-warrior-shield': 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-dashed animate-pulse',
    'legend-league-crown': 'border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,1)] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 animate-pulse'
  };
  return map[value] || 'border-slate-500';
}

const THEME_COLORS = {
  Midnight: { primary: '#6366f1', accent: '#818cf8', bg: 'bg-indigo-950/40 border-indigo-500/20' },
  Cyber: { primary: '#22d3ee', accent: '#a78bfa', bg: 'bg-gradient-to-br from-cyan-950/65 via-slate-900/40 to-purple-950/65 border-cyan-400/30' },
  Sakura: { primary: '#ec4899', accent: '#f472b6', bg: 'bg-pink-950/40 border-pink-500/20' },
  Ocean: { primary: '#0ea5e9', accent: '#3b82f6', bg: 'bg-sky-950/40 border-sky-500/20' },
  Amethyst: { primary: '#8b5cf6', accent: '#6366f1', bg: 'bg-violet-950/40 border-violet-500/20' },
  Rose: { primary: '#f43f5e', accent: '#d946ef', bg: 'bg-rose-950/40 border-rose-500/20' },
  Mint: { primary: '#2dd4bf', accent: '#10b981', bg: 'bg-gradient-to-br from-teal-950/65 via-slate-900/40 to-emerald-950/65 border-emerald-400/30' },
  Emerald: { primary: '#10b981', accent: '#14b8a6', bg: 'bg-emerald-950/40 border-emerald-500/20' },
  Crimson: { primary: '#e11d48', accent: '#f43f5e', bg: 'bg-gradient-to-br from-rose-950/65 via-stone-900/40 to-red-950/65 border-rose-400/30' },
  Coral: { primary: '#fb7185', accent: '#f97316', bg: 'bg-red-950/40 border-red-500/20' },
  Slate: { primary: '#64748b', accent: '#94a3b8', bg: 'bg-slate-900/60 border-slate-700/20' },
  Amber: { primary: '#f59e0b', accent: '#eab308', bg: 'bg-gradient-to-br from-amber-950/60 via-yellow-950/40 to-amber-950/60 border-amber-400/30' },
};

// Helper for theme visual preview swatches
function getThemePreviewComponent(value) {
  const colors = THEME_COLORS[value] || THEME_COLORS.Ocean;
  const isGold = value === 'Amber';
  const isCyber = value === 'Cyber';
  const isCrimson = value === 'Crimson';
  const isMint = value === 'Mint';
  
  return (
    <div className={`w-full h-full flex ${colors.bg} border rounded-xl overflow-hidden p-1 gap-1 relative group-hover:scale-102 transition-transform duration-300`}>
      {/* Golden Shimmer overlay for Amber */}
      {isGold && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1500ms] ease-out pointer-events-none z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.15),transparent_70%)] pointer-events-none z-10 animate-pulse"></div>
        </>
      )}
      {/* Cyber/Holo Shimmer for Cyber (Cosmic Diamond) */}
      {isCyber && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out pointer-events-none z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.15),transparent_70%)] pointer-events-none z-10 animate-pulse"></div>
        </>
      )}
      {/* Crimson Lava Shimmer for Crimson (Ruby Sovereign) */}
      {isCrimson && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1800ms] ease-out pointer-events-none z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.15),transparent_70%)] pointer-events-none z-10 animate-pulse"></div>
        </>
      )}
      {/* Forest/Mint Shimmer for Mint (Forest Sovereign) */}
      {isMint && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1600ms] ease-out pointer-events-none z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none z-10 animate-pulse"></div>
        </>
      )}

      {/* Mini Sidebar */}
      <div className={`w-[30%] h-full rounded flex flex-col gap-1 p-1 shrink-0 ${
        isGold ? 'bg-yellow-950/80' : 
        isCyber ? 'bg-cyan-950/80' : 
        isCrimson ? 'bg-rose-950/80' : 
        isMint ? 'bg-emerald-950/80' : 'bg-slate-950/65'
      }`}>
        {/* Sidebar Logo */}
        <div className={`w-full h-1.5 rounded-sm ${
          isGold ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500' : 
          isCyber ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500' : 
          isCrimson ? 'bg-gradient-to-r from-rose-500 via-red-400 to-orange-500' : 
          isMint ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500' : ''
        }`} style={(!isGold && !isCyber && !isCrimson && !isMint) ? { backgroundColor: colors.primary } : {}}></div>
        
        {/* Sidebar Items */}
        <div className={`w-2/3 h-1 rounded-sm ${isGold ? 'bg-yellow-400/30' : isCyber ? 'bg-cyan-400/30' : isCrimson ? 'bg-rose-400/30' : isMint ? 'bg-emerald-400/30' : 'bg-white/25'}`}></div>
        <div className={`w-3/4 h-1 rounded-sm ${isGold ? 'bg-amber-400/15' : isCyber ? 'bg-cyan-400/15' : isCrimson ? 'bg-rose-400/15' : isMint ? 'bg-emerald-400/15' : 'bg-white/10'}`}></div>
        <div className={`w-1/2 h-1 rounded-sm ${isGold ? 'bg-amber-400/15' : isCyber ? 'bg-cyan-400/15' : isCrimson ? 'bg-rose-400/15' : isMint ? 'bg-emerald-400/15' : 'bg-white/10'}`}></div>
        <div className={`w-2/3 h-1 rounded-sm mt-auto ${isGold ? 'bg-yellow-400/25' : isCyber ? 'bg-cyan-400/25' : isCrimson ? 'bg-rose-400/25' : isMint ? 'bg-emerald-400/25' : 'bg-white/15'}`}></div>
      </div>
      
      {/* Mini Main Content Area */}
      <div className="flex-1 h-full flex flex-col gap-1 p-0.5">
        {/* Mini Header */}
        <div className={`w-full flex items-center justify-between border-b pb-0.5 ${
          isGold ? 'border-yellow-400/10' : 
          isCyber ? 'border-cyan-400/10' : 
          isCrimson ? 'border-rose-400/10' : 
          isMint ? 'border-emerald-400/10' : 'border-white/5'
        }`}>
          <div className={`w-1/3 h-1 rounded-sm ${
            isGold ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 
            isCyber ? 'bg-gradient-to-r from-cyan-400 to-blue-400' : 
            isCrimson ? 'bg-gradient-to-r from-rose-500 to-red-400' : 
            isMint ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : ''
          }`} style={(!isGold && !isCyber && !isCrimson && !isMint) ? { backgroundColor: colors.accent } : {}}></div>
          
          <div className={`w-2.5 h-2.5 rounded-full ${
            isGold ? 'bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 
            isCyber ? 'bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_6px_rgba(34,211,238,0.6)]' : 
            isCrimson ? 'bg-gradient-to-br from-rose-400 to-red-600 shadow-[0_0_6px_rgba(244,63,94,0.6)]' : 
            isMint ? 'bg-gradient-to-br from-emerald-300 to-teal-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : ''
          }`} style={(!isGold && !isCyber && !isCrimson && !isMint) ? { backgroundColor: colors.primary } : {}}></div>
        </div>
        
        {/* Mini Dashboard Content */}
        <div className="grid grid-cols-2 gap-1 flex-1">
          {/* Card 1: Stats */}
          <div className={`rounded p-1 flex flex-col gap-0.5 border justify-center ${
            isGold ? 'bg-yellow-950/50 border-yellow-400/10' : 
            isCyber ? 'bg-cyan-950/50 border-cyan-400/10' : 
            isCrimson ? 'bg-rose-950/50 border-rose-400/10' : 
            isMint ? 'bg-emerald-950/50 border-emerald-400/10' : 'bg-slate-950/40 border-white/5'
          }`}>
            <div className={`w-3/4 h-0.5 rounded-sm ${
              isGold ? 'bg-yellow-400/20' : 
              isCyber ? 'bg-cyan-400/20' : 
              isCrimson ? 'bg-rose-400/20' : 
              isMint ? 'bg-emerald-400/20' : 'bg-white/10'
            }`}></div>
            <div className={`w-1/2 h-1.5 rounded-sm ${
              isGold ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 
              isCyber ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 
              isCrimson ? 'bg-gradient-to-r from-rose-500 to-red-500' : 
              isMint ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : ''
            }`} style={(!isGold && !isCyber && !isCrimson && !isMint) ? { backgroundColor: colors.primary } : {}}></div>
          </div>
          {/* Card 2: Specialty Icon */}
          <div className={`rounded p-1 flex flex-col justify-center items-center gap-1 border ${
            isGold ? 'bg-yellow-950/50 border-yellow-400/10' : 
            isCyber ? 'bg-cyan-950/50 border-cyan-400/10' : 
            isCrimson ? 'bg-rose-950/50 border-rose-400/10' : 
            isMint ? 'bg-emerald-950/50 border-emerald-400/10' : 'bg-slate-950/40 border-white/5'
          }`}>
            {isGold ? (
              <Crown size={14} className="text-yellow-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]" />
            ) : isCyber ? (
              <Award size={14} className="text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]" />
            ) : isCrimson ? (
              <Flame size={14} className="text-rose-500 drop-shadow-[0_0_4px_rgba(244,63,94,0.8)]" />
            ) : isMint ? (
              <Sparkles size={14} className="text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: colors.primary }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent }}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper for effect visual animation preview
function getEffectPreviewComponent(value) {
  const effectsMap = {
    'sparkles': (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-xl relative overflow-hidden">
        <Zap size={20} className="text-yellow-400 animate-bounce" />
        <span className="absolute top-2 left-2 text-xs animate-ping">✨</span>
        <span className="absolute bottom-2 right-2 text-xs animate-ping duration-700">✨</span>
      </div>
    ),
    'fire-aura': (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 rounded-xl relative overflow-hidden border border-orange-500/20">
        <Flame size={24} className="text-orange-500 animate-pulse scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/15 via-red-500/5 to-transparent pointer-events-none animate-pulse"></div>
      </div>
    ),
    'lightning-aura': (
      <div className="w-full h-full flex items-center justify-center bg-neutral-950 rounded-xl relative overflow-hidden border border-violet-500/20">
        <Zap size={24} className="text-violet-400 animate-pulse duration-200" />
        <div className="absolute inset-0 bg-violet-500/10 animate-pulse pointer-events-none duration-100"></div>
      </div>
    ),
    'galaxy-aura': (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-xl relative overflow-hidden border border-pink-500/20">
        <Sparkles size={20} className="text-pink-400 animate-spin duration-3000" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/15 via-pink-500/15 to-transparent pointer-events-none animate-pulse"></div>
      </div>
    ),
    'perfect-attendance-aura': (
      <div className="w-full h-full flex items-center justify-center bg-amber-950/20 rounded-xl relative overflow-hidden border border-yellow-400/20">
        <Crown size={24} className="text-yellow-400 animate-bounce duration-[2000ms]" />
        <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none animate-pulse"></div>
      </div>
    ),
    'snowstorm': (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-xl relative overflow-hidden">
        <span className="text-white animate-bounce text-xl">❄️</span>
        <span className="absolute top-1 left-2 text-[8px] animate-pulse text-white">❄️</span>
        <span className="absolute bottom-2 right-3 text-[10px] animate-pulse text-white">❄️</span>
      </div>
    ),
    'heartbeat': (
      <div className="w-full h-full flex items-center justify-center bg-rose-950/25 rounded-xl relative overflow-hidden border border-rose-500/20">
        <Heart size={20} className="text-rose-500 animate-ping duration-1000" />
      </div>
    ),
    'cyber-grid': (
      <div className="w-full h-full flex flex-col justify-center items-center bg-zinc-950 rounded-xl relative overflow-hidden border border-emerald-500/20">
        <div className="w-full h-0.5 bg-emerald-500/40 animate-bounce"></div>
        <span className="text-[8px] font-mono text-emerald-400">SCANNING...</span>
      </div>
    ),
    'legend-crown-aura': (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 rounded-xl relative overflow-hidden border border-yellow-400/20">
        <Crown size={20} className="text-yellow-400 animate-bounce" />
        <span className="absolute top-1 right-2 text-xs">✨</span>
      </div>
    ),
    'warrior-flame': (
      <div className="w-full h-full flex items-center justify-center bg-emerald-950/30 rounded-xl relative overflow-hidden border border-emerald-500/20">
        <Flame size={22} className="text-emerald-400 animate-pulse" />
      </div>
    )
  };
  return effectsMap[value] || (
    <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-xl">
      <Zap size={20} className="text-slate-400" />
    </div>
  );
}

// Helper for namecolor premium shine effect
function getNamecolorPreview(item) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center bg-slate-900 border border-slate-700/50 rounded-xl relative overflow-hidden p-2 shadow-inner">
      <span className={`text-sm font-black tracking-wider uppercase ${item.value} animate-pulse namecolor-shine`}>
        {item.name.replace(' Namecolor', '')}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-[1500ms] ease-out pointer-events-none"></div>
    </div>
  );
}

export default GamificationShop;
