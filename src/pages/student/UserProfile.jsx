import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import { 
  User as UserIcon, Mail, Phone, GitBranch, Briefcase, Globe, Save, Loader2, Code, Terminal, Eye, EyeOff, Camera 
} from 'lucide-react';

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
    'top-10-border': 'border-transparent bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_30px_rgba(6,182,212,0.9)] animate-pulse',
    'frozen-frost': 'border-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.8)] animate-pulse bg-gradient-to-tr from-sky-400 to-blue-500',
    'shadow-assassin': 'border-purple-950 shadow-[0_0_20px_rgba(88,28,135,0.7)] bg-gradient-to-tr from-zinc-950 via-purple-950 to-zinc-900 animate-pulse duration-[3000ms]',
    'weekly-warrior-shield': 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-dashed animate-pulse',
    'legend-league-crown': 'border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,1)] bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 animate-pulse'
  };
  return map[value] || 'border-slate-500';
};

const UserProfile = () => {
  const { user: authUser, login, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [gamificationData, setGamificationData] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    github: '',
    linkedin: '',
    portfolio: '',
    leetcode: '',
    hackerrank: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfileAndStatus = async () => {
      try {
        const [profileRes, gamificationRes] = await Promise.all([
          axios.get('/auth/profile'),
          axios.get('/gamification/status')
        ]);
        const data = profileRes.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          github: data.github || '',
          linkedin: data.linkedin || '',
          portfolio: data.portfolio || '',
          leetcode: data.leetcode || '',
          hackerrank: data.hackerrank || '',
          password: '',
          confirmPassword: '',
        });
        setGamificationData(gamificationRes.data);
      } catch (error) {
        console.error('Error fetching profile or status:', error);
        Swal.fire('Error', 'Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndStatus();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Please upload an image file.', 'error');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      // 1. Upload file
      const uploadRes = await axios.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = uploadRes.data.url || uploadRes.data.fileUrl;

      // 2. Equipped via custom avatar endpoint
      await axios.post('/gamification/custom-avatar', { avatarUrl: fileUrl });

      Swal.fire({
        icon: 'success',
        title: 'Custom Photo Equipped!',
        text: 'Your custom profile photo has been successfully set.',
        timer: 2000,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000'
      });

      // 3. Refresh local profile image
      if (updateUser) {
        updateUser({ ...authUser, equippedAvatar: fileUrl });
      }
      setGamificationData(prev => ({ ...prev, equippedAvatar: fileUrl }));
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match!',
        background: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      });
      return;
    }
    
    setSaving(true);
    try {
      // Create payload without confirmPassword
      const payload = { ...formData };
      delete payload.confirmPassword;
      if (!payload.password) {
        delete payload.password;
      }

      const { data } = await axios.put('/auth/profile', payload);
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile information has been successfully updated.',
        background: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
        confirmButtonColor: '#0ea5e9'
      });
      // Update local context
      updateUser(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Something went wrong',
        background: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div 
          onClick={() => {
            if (gamificationData?.isRankOne) {
              document.getElementById('profile-photo-input').click();
            } else {
              Swal.fire({
                icon: 'info',
                title: 'Leaderboard Rank #1 Exclusive',
                text: 'Only the Top #1 student on the leaderboard is allowed to upload and use a custom profile photo! Keep scoring high to reach Rank #1!',
                confirmButtonColor: '#0ea5e9',
                background: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
                color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
              });
            }
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden cursor-pointer relative group transition-transform hover:scale-105 shadow-lg ${
            gamificationData?.profileBorder 
              ? `border-3 p-0.5 ${getBorderPreviewClass(gamificationData.profileBorder)}` 
              : 'border-4 border-white dark:border-white/10 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          {uploading ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <Loader2 className="text-white animate-spin" size={20} />
            </div>
          ) : null}

          {/* Camera hover overlay (Only if Rank 1) */}
          {gamificationData?.isRankOne && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity z-10">
              <Camera size={18} />
              <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wider">Change</span>
            </div>
          )}

          {gamificationData?.equippedAvatar ? (
            <img 
              src={
                gamificationData.equippedAvatar.startsWith('/uploads')
                  ? `${import.meta.env.VITE_API_URL || ''}${gamificationData.equippedAvatar}`
                  : gamificationData.equippedAvatar
              } 
              alt="Profile" 
              className="w-full h-full object-cover object-top rounded-full" 
            />
          ) : (
            <UserIcon className="text-slate-400 dark:text-slate-500" size={32} />
          )}
        </div>

        {/* Hidden File Input */}
        {gamificationData?.isRankOne && (
          <input 
            type="file" 
            id="profile-photo-input" 
            className="hidden" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
          />
        )}

        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your personal information and social links</p>
        </div>
      </div>

      {/* Rank #1 Perks Announcement */}
      {gamificationData?.isRankOne && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-600/20 border border-amber-500/30 p-6 md:p-8 shadow-xl shadow-amber-500/5 mb-2 group animate-in slide-in-from-top-4 duration-300 text-left">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20 shrink-0 animate-bounce">
              👑
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-extrabold text-amber-500 dark:text-amber-400 flex items-center gap-2">
                Leaderboard Dominance: You are Rank #1!
                <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-amber-500 text-slate-900 animate-pulse">Top Unlocked Perks</span>
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                Congratulations! As the reigning Top #1 student on the SSMS leaderboard, you have unlocked exclusive legendary privileges:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="flex items-start gap-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-2xl p-3.5 hover:bg-amber-500/10 transition-colors">
                  <div className="text-xl mt-0.5">📸</div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Custom Profile Photo</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Upload any custom photo from your device by clicking your profile picture on this page!</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-2xl p-3.5 hover:bg-amber-500/10 transition-colors">
                  <div className="text-xl mt-0.5">🎨</div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Workspace Color Theme Customizer</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Style your workspace by picking a custom hex color from the palette menu in the top navbar header.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-2xl p-3.5 hover:bg-amber-500/10 transition-colors">
                  <div className="text-xl mt-0.5">✨</div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Pulsing Profile Glow</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Your profile image has a glowing ring aura highlighting your top rank in lists, chats, and rankings.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-2xl p-3.5 hover:bg-amber-500/10 transition-colors">
                  <div className="text-xl mt-0.5">🔥</div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Reigning Champion Prestige</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Showcase your rank position badge across the learning board and earn admiration from peers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 space-y-6">
        
        {/* Basic Info Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-white/10 pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address (Read Only)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  className="input-field pl-10 opacity-70 cursor-not-allowed bg-slate-100 dark:bg-white/5"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (234) 567-8900"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-white/10 pb-2 mt-8">Professional Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">GitHub URL</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="url" 
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  className="input-field pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">LinkedIn URL</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="url" 
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Portfolio Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="url" 
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coding Platforms Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-white/10 pb-2 mt-8">Coding Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">LeetCode URL</label>
              <div className="relative">
                <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="url" 
                  name="leetcode"
                  value={formData.leetcode}
                  onChange={handleChange}
                  placeholder="https://leetcode.com/username"
                  className="input-field pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">HackerRank URL</label>
              <div className="relative">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="url" 
                  name="hackerrank"
                  value={formData.hackerrank}
                  onChange={handleChange}
                  placeholder="https://hackerrank.com/username"
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-white/10 pb-2 mt-8">Security</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password (Optional)</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="input-field px-3"
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="input-field px-3"
                  minLength={6}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default UserProfile;
