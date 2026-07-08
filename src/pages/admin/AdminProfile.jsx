import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import { 
  User as UserIcon, Mail, Phone, Lock, Save, Loader2, Camera 
} from 'lucide-react';

const AdminProfile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(authUser?.equippedAvatar || authUser?.profileImage || '');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/auth/profile');
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
        });
        setProfileImage(data.equippedAvatar || data.profileImage || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        Swal.fire('Error', 'Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
      const uploadRes = await axios.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const fileUrl = uploadRes.data.url || uploadRes.data.fileUrl;

      // Update backend profile record
      await axios.put('/auth/profile', { profileImage: fileUrl });

      Swal.fire({
        icon: 'success',
        title: 'Profile Photo Updated!',
        text: 'Your custom profile photo has been successfully saved.',
        timer: 2000,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000'
      });

      setProfileImage(fileUrl);
      if (updateUser) {
        updateUser({ ...authUser, equippedAvatar: fileUrl, profileImage: fileUrl });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const updateData = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }

    try {
      await axios.put('/auth/profile', updateData);
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your admin profile has been successfully updated.',
        background: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000',
        confirmButtonColor: '#0ea5e9'
      });
      setFormData({ ...formData, password: '' });
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
      <div className="flex items-center gap-6">
        <div className="relative group/avatar shrink-0">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center border-4 border-white dark:border-white/10 shadow-lg overflow-hidden relative">
            {profileImage ? (
              <img 
                src={profileImage.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || ''}${profileImage}` : profileImage} 
                alt="Admin Avatar" 
                className="w-full h-full object-cover object-top"
              />
            ) : (
               <UserIcon size={36} />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-colors border-2 border-white dark:border-slate-900">
            <Camera size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Profile</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your administrative account and security settings</p>
        </div>
      </div>

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

        {/* Security Section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-200 dark:border-white/10 pb-2 mt-8">Security settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Change Password (Leave blank to keep current)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="input-field pl-10"
                  minLength="6"
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

export default AdminProfile;
