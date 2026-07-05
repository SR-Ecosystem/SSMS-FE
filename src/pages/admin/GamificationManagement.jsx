import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  Gamepad2, Plus, Edit, Trash2, Search, RefreshCw, X, Coins, 
  Sparkles, Trophy, Palette, Eye, ShieldAlert, Star, Camera, UploadCloud, Image
} from 'lucide-react';

const CATEGORY_DETAILS = {
  avatar: { label: 'Avatars', icon: '👤', color: 'text-blue-500' },
  border: { label: 'Borders', icon: '🖼️', color: 'text-indigo-500' },
  title: { label: 'Titles', icon: '🏆', color: 'text-yellow-500' },
  theme: { label: 'Themes', icon: '🎨', color: 'text-emerald-500' },
  effect: { label: 'Effects', icon: '✨', color: 'text-fuchsia-500' },
  pet: { label: 'Pets', icon: '🐾', color: 'text-pink-500' },
  namecolor: { label: 'Name Colors', icon: '🏷️', color: 'text-violet-500' }
};

const RARITY_COLORS = {
  Common: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  Rare: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
  Epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
  Legendary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  Mythic: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
};

const RARITY_GLOWS = {
  Common: 'hover:shadow-[0_0_30px_rgba(100,116,139,0.15)] hover:border-slate-500/25',
  Rare: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-500/30',
  Epic: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-500/30',
  Legendary: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:border-amber-500/35',
  Mythic: 'hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] hover:border-rose-500/35'
};

const getEffectStyles = (effectName) => {
  switch (effectName) {
    case 'fire-aura':
      return 'ring-4 ring-orange-500 ring-offset-2 shadow-[0_0_20px_#f97316] animate-pulse';
    case 'lightning-aura':
      return 'ring-4 ring-violet-500 ring-offset-2 shadow-[0_0_20px_#a855f7] animate-pulse';
    case 'galaxy-aura':
      return 'ring-4 ring-pink-500 ring-offset-2 shadow-[0_0_20px_#ec4899]';
    case 'sparkles':
      return 'ring-4 ring-yellow-400 ring-offset-2 shadow-[0_0_15px_#eab308]';
    case 'snowstorm':
      return 'ring-4 ring-sky-300 ring-offset-2 shadow-[0_0_15px_#38bdf8]';
    case 'heartbeat':
      return 'ring-4 ring-rose-500 ring-offset-2 shadow-[0_0_18px_#f43f5e]';
    case 'cyber-grid':
      return 'ring-4 ring-cyan-400 ring-offset-2 shadow-[0_0_20px_#22d3ee]';
    case 'perfect-attendance-aura':
      return 'ring-4 ring-amber-400 ring-offset-2 shadow-[0_0_25px_#f59e0b]';
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

const getThemeGradient = (themeName) => {
  const gradients = {
    'Amethyst': 'from-purple-600 to-indigo-600',
    'Sapphire': 'from-blue-600 to-cyan-600',
    'Emerald': 'from-emerald-600 to-teal-600',
    'Ruby': 'from-rose-600 to-pink-600',
    'Amber': 'from-amber-600 to-orange-600',
    'Midnight': 'from-slate-950 via-slate-900 to-slate-950',
    'Sunset': 'from-pink-500 via-red-500 to-yellow-500',
    'Matrix': 'from-green-950 via-black to-green-950',
    'Cyberpunk': 'from-fuchsia-600 via-pink-600 to-cyan-500',
    'Ocean': 'from-sky-500 via-blue-600 to-indigo-700',
    'Obsidian': 'from-neutral-900 to-neutral-950 border-neutral-800'
  };
  return gradients[themeName] || 'from-slate-700 to-slate-800';
};

const GamificationManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'avatar',
    rarity: 'Common',
    cost: 0,
    isPurchasable: true,
    achievementRequired: '',
    imageUrl: '',
    value: '',
    description: '',
    isLimited: false,
    isActive: true,
    requiredLevel: 1,
    sortOrder: 0
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      setUploading(true);
      const uploadRes = await axios.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = uploadRes.data.url || uploadRes.data.fileUrl;
      setFormData(prev => ({ 
        ...prev, 
        value: fileUrl,
        imageUrl: fileUrl 
      }));
      Swal.fire({
        title: 'Uploaded!',
        text: 'Avatar image uploaded successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('File upload failed:', error);
      Swal.fire('Error', error.response?.data?.message || 'File upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCardImageUpload = async (item, file) => {
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      Swal.fire({
        title: 'Uploading...',
        text: 'Uploading image and saving to item...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const uploadRes = await axios.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = uploadRes.data.url || uploadRes.data.fileUrl;

      // Update in database
      const updatedFields = {
        ...item,
        value: fileUrl,
        imageUrl: fileUrl
      };

      await axios.put(`/gamification/admin/shop/${item._id}`, updatedFields);
      
      Swal.fire({
        title: 'Success!',
        text: `Avatar image for "${item.name}" updated successfully.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      fetchItems();
    } catch (error) {
      console.error('In-place upload failed:', error);
      Swal.fire('Error', error.response?.data?.message || 'File upload failed.', 'error');
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/gamification/admin/shop');
      setItems(data);
    } catch (error) {
      console.error('Failed to load shop items:', error);
      Swal.fire('Error', 'Could not load gamification shop items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'avatar',
      rarity: 'Common',
      cost: 0,
      isPurchasable: true,
      achievementRequired: '',
      imageUrl: '',
      value: '',
      description: '',
      isLimited: false,
      isActive: true,
      requiredLevel: 1,
      sortOrder: 0
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'avatar',
      rarity: item.rarity || 'Common',
      cost: item.cost || 0,
      isPurchasable: item.isPurchasable !== undefined ? item.isPurchasable : true,
      achievementRequired: item.achievementRequired || '',
      imageUrl: item.imageUrl || '',
      value: item.value || '',
      description: item.description || '',
      isLimited: item.isLimited !== undefined ? item.isLimited : false,
      isActive: item.isActive !== undefined ? item.isActive : true,
      requiredLevel: item.requiredLevel || 1,
      sortOrder: item.sortOrder || 0
    });
    setModalOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: 'Delete Shop Item?',
      text: `Are you sure you want to delete "${item.name}"? Users who unlocked this item will no longer be able to use it!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/gamification/admin/shop/${item._id}`);
        fetchItems();
        Swal.fire('Deleted!', 'Shop item has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not delete item.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Edit Item
        await axios.put(`/gamification/admin/shop/${editingItem._id}`, formData);
        Swal.fire({
          title: 'Success!',
          text: 'Shop item updated successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Add Item
        await axios.post('/gamification/admin/shop', formData);
        Swal.fire({
          title: 'Success!',
          text: 'Shop item created successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
      setModalOpen(false);
      fetchItems();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save shop item.', 'error');
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.value.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeCategoryTab === 'All' || item.category === activeCategoryTab;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header section matching premium SSMS 3.0 visual design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Gamepad2 className="text-theme-primary text-2xl" />
            Gamification Shop Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage cosmetic items, pets, avatar resources, and custom CSS overrides available in the Gamification Hub Shop.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 flex items-center justify-center gap-2 bg-gradient-to-r from-theme-primary to-theme-accent text-white font-extrabold text-sm rounded-xl hover:scale-[1.02] shadow-lg shadow-theme-primary/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Plus size={16} /> Add Shop Item
        </button>
      </div>

      {/* Search & Filter section */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800/60 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search items by name, value, description..."
            className="input-field pl-9 py-1.5 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={fetchItems}
          disabled={loading}
          className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Horizontal categories tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCategoryTab('All')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
            activeCategoryTab === 'All'
              ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md'
              : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          All ({items.length})
        </button>
        {Object.entries(CATEGORY_DETAILS).map(([key, details]) => {
          const count = items.filter(item => item.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveCategoryTab(key)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeCategoryTab === key
                  ? 'bg-theme-primary text-white border-transparent shadow-md'
                  : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{details.icon}</span>
              {details.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Inventory Grid View */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-theme-primary opacity-60" />
          <p className="font-bold">Loading items catalog...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 dark:text-slate-400 rounded-3xl">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-theme-primary opacity-30" />
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">No items found</p>
          <p className="text-sm mt-1 font-medium">Try adding a new item or adjusting search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const cat = CATEGORY_DETAILS[item.category] || { label: item.category, icon: '📦', color: 'text-slate-500' };
            const isImageCategory = item.category === 'avatar' || item.category === 'pet';
            const imgUrl = isImageCategory && item.value ? 
              ((item.value.startsWith('/uploads') || item.value.startsWith('/api')) ? `${import.meta.env.VITE_API_URL || ''}${item.value}` : item.value) 
              : null;

            // Define card-level file upload input ref trigger
            let fileInputRef = null;

            return (
              <div 
                key={item._id} 
                className={`bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/85 p-6 rounded-[28px] relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${RARITY_GLOWS[item.rarity] || ''} ${
                  item.isActive ? '' : 'opacity-65'
                } group`}
              >
                <div>
                  {/* Category Pill and Rarity Badge */}
                  <div className="flex justify-between items-center mb-5">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-1`}>
                      <span>{cat.icon}</span> {cat.label}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${RARITY_COLORS[item.rarity] || ''}`}>
                      {item.rarity}
                    </span>
                  </div>

                  {/* Sleek Central Preview Area */}
                  <div className="relative w-full h-36 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-center mb-5 overflow-hidden group-hover:border-slate-250 dark:group-hover:border-slate-700/50 transition-colors">
                    {item.category === 'avatar' || item.category === 'pet' ? (
                      <div 
                        onClick={() => fileInputRef && fileInputRef.click()}
                        className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 flex items-center justify-center shadow-md group/img cursor-pointer transition-all duration-300 hover:scale-105"
                      >
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={item.name} 
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <Image className="text-slate-400 dark:text-slate-600 w-8 h-8" />
                        )}
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white text-[10px] font-extrabold gap-1 text-center px-1">
                          <Camera size={14} className="text-amber-400" />
                          <span>Update Photo</span>
                        </div>
                        {/* Hidden input trigger */}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          ref={el => fileInputRef = el}
                          onChange={(e) => handleCardImageUpload(item, e.target.files[0])}
                        />
                      </div>
                    ) : item.category === 'border' ? (
                      <div className="relative w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-inner">
                        {/* Styled Border class applied directly */}
                        <div className={`absolute inset-0.5 rounded-full border-4 ${item.value}`} />
                        <span className="text-xl text-slate-500 z-10">👤</span>
                      </div>
                    ) : item.category === 'title' ? (
                      <div className="py-2 px-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/20 rounded-xl text-center shadow-md max-w-[85%]">
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-[0.2em] block mb-0.5">UNLOCKED TITLE</span>
                        <span className="font-extrabold text-xs text-amber-100 uppercase tracking-wide drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                          {item.value || item.name}
                        </span>
                      </div>
                    ) : item.category === 'theme' ? (
                      <div className="w-[80%] h-[75%] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 flex flex-col justify-between shadow-md">
                        <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-800/60">
                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Theme Preview</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        </div>
                        <div className={`h-10 rounded-lg bg-gradient-to-r ${getThemeGradient(item.value)} flex items-center justify-center`}>
                          <span className="text-[9px] font-bold text-white uppercase tracking-wider drop-shadow-sm">{item.value}</span>
                        </div>
                      </div>
                    ) : item.category === 'namecolor' ? (
                      <div className="py-2.5 px-4 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-center max-w-[80%] shadow-md">
                        <span className="text-[8px] uppercase text-slate-400 block mb-0.5">Name Shimmer</span>
                        <span className={`text-sm font-extrabold namecolor-shine ${getNamecolorClass(item.value)}`}>
                          Saran_Admin
                        </span>
                      </div>
                    ) : item.category === 'effect' ? (
                      <div className="relative w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                        {/* Glow effect outer ring */}
                        <div className={`absolute inset-0 rounded-full ${getEffectStyles(item.value)}`} />
                        <span className="text-lg z-10">✨</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Item Text Details */}
                  <div className="mb-4">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base leading-snug group-hover:text-theme-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Item specifications details list */}
                  <div className="space-y-2 text-xs font-bold mb-5 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase text-slate-400 tracking-wider">Purchase Cost</span>
                      <span className="text-amber-500 flex items-center gap-1 text-sm">
                        <Coins size={13} className="fill-amber-500/20" /> {item.cost}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                      <span className="text-[10px] uppercase text-slate-400 tracking-wider">Required Level</span>
                      <span className="text-slate-700 dark:text-slate-300 font-extrabold bg-slate-100 dark:bg-slate-805 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700/30">Lvl {item.requiredLevel}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                      <span className="text-[10px] uppercase text-slate-400 tracking-wider">Value (Class/String)</span>
                      <code className="text-[9px] font-mono text-slate-650 dark:text-slate-300 max-w-[150px] truncate" title={item.value}>
                        {item.value || 'N/A'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Item Actions */}
                <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/50">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 py-2 flex items-center justify-center gap-1.5 font-bold text-xs bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700/60 hover:scale-[1.02] cursor-pointer"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="py-2 px-3.5 flex items-center justify-center gap-1.5 font-bold text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20 hover:scale-[1.02] cursor-pointer"
                    title="Delete Shop Item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Add Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-black text-slate-850 dark:text-white flex items-center gap-2">
                <Gamepad2 className="text-theme-primary" size={20} />
                {editingItem ? 'Edit Shop Item' : 'Add Shop Item'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baby Yoda Pet"
                    className="input-field py-2 text-sm w-full"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                  <select
                    className="input-field py-2 text-sm w-full"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="avatar">👤 Avatar</option>
                    <option value="border">🖼️ Border</option>
                    <option value="title">🏆 Title</option>
                    <option value="theme">🎨 Theme</option>
                    <option value="effect">✨ Effect</option>
                    <option value="pet">🐾 Pet</option>
                    <option value="namecolor">🏷️ Name Color</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Rarity</label>
                  <select
                    className="input-field py-2 text-sm w-full"
                    value={formData.rarity}
                    onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value }))}
                  >
                    <option value="Common">Common</option>
                    <option value="Rare">Rare</option>
                    <option value="Epic">Epic</option>
                    <option value="Legendary">Legendary</option>
                    <option value="Mythic">Mythic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Cost (Coins)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="input-field py-2 text-sm w-full"
                    value={formData.cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Req. Level</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field py-2 text-sm w-full"
                    value={formData.requiredLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredLevel: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                {(formData.category === 'avatar' || formData.category === 'pet') && (
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-850/60 p-5 rounded-[24px] border border-dashed border-slate-250 dark:border-slate-800/80 flex flex-col items-center justify-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Photo Upload</p>
                    
                    {/* Interactive Upload/Edit Circle */}
                    <div 
                      onClick={() => !uploading && document.getElementById('modal-image-upload-input').click()}
                      className="relative w-28 h-28 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg group cursor-pointer hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                    >
                      {formData.value ? (
                        <img 
                          src={(formData.value.startsWith('/uploads') || formData.value.startsWith('/api')) ? `${import.meta.env.VITE_API_URL || ''}${formData.value}` : formData.value} 
                          alt="Preview" 
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <Image className="text-slate-400 dark:text-slate-600 w-8 h-8" />
                      )}

                      {/* Edit Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white text-[11px] font-extrabold gap-1 text-center px-2">
                        {uploading ? (
                          <>
                            <RefreshCw size={16} className="animate-spin text-amber-400" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Camera size={16} className="text-amber-400" />
                            <span>Upload Photo</span>
                          </>
                        )}
                      </div>
                    </div>

                    <input 
                      id="modal-image-upload-input"
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    
                    <p className="text-[10px] text-slate-400 text-center font-medium max-w-[80%] leading-relaxed">
                      Click the frame above to select and upload a custom cosmetic PNG/JPG/WebP image.
                    </p>
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    Value (CSS Class / Pet Code / Theme Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. text-red-500, /avatars/goku.png, Amethyst, fire-aura"
                    className="input-field py-2 font-mono text-sm w-full"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    * Make sure this matches the cosmetic codes defined in the stylesheets/mappings.
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
                  <textarea
                    rows="2"
                    placeholder="Brief details about the unlockable perk..."
                    className="input-field py-2 text-sm w-full"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Sort Order</label>
                  <input
                    type="number"
                    className="input-field py-2 text-sm w-full"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex flex-col justify-end gap-3 mt-4 col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-theme-primary focus:ring-theme-primary"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Active (Show in shop)
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-theme-primary focus:ring-theme-primary"
                      checked={formData.isPurchasable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPurchasable: e.target.checked }))}
                    />
                    Purchasable with Coins
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-theme-primary to-theme-accent text-white font-extrabold text-sm rounded-xl hover:scale-[1.02] shadow-lg shadow-theme-primary/10 transition-transform cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationManagement;
