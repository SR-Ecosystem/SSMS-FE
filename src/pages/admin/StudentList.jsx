import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Loader2, Mail, Phone, GitBranch, Briefcase, Globe, Code, Terminal, Search, User as UserIcon, RefreshCw, Key } from 'lucide-react';
import Loader from '../../components/Loader';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, batchesRes] = await Promise.all([
        axios.get(`/auth/students${selectedBatch ? `?batchId=${selectedBatch}` : ''}`),
        axios.get('/batches')
      ]);
      setStudents(studentsRes.data);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBatch]);

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePassword = async (student) => {
    const { value: newPassword } = await Swal.fire({
      title: 'Change Password',
      text: `Enter new password for ${student.name}`,
      html: `
        <div style="position: relative; max-width: 100%; margin-top: 1rem;">
          <input type="password" id="swal-password-input" class="swal2-input" placeholder="New Password (min 6 chars)" style="width: 100%; max-width: 100%; margin: 0; box-sizing: border-box; padding-right: 40px;" autocapitalize="off" autocorrect="off">
          <button type="button" id="swal-toggle-password" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="swal-eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Password',
      confirmButtonColor: '#0ea5e9',
      background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
      color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
      didOpen: () => {
        const input = document.getElementById('swal-password-input');
        const toggleBtn = document.getElementById('swal-toggle-password');
        const eyeIcon = document.getElementById('swal-eye-icon');
        
        toggleBtn.addEventListener('click', () => {
          if (input.type === 'password') {
            input.type = 'text';
            // EyeOff SVG path
            eyeIcon.innerHTML = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>';
            eyeIcon.style.color = '#0ea5e9';
          } else {
            input.type = 'password';
            // Eye SVG path
            eyeIcon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
            eyeIcon.style.color = '#64748b';
          }
        });
      },
      preConfirm: () => {
        const val = document.getElementById('swal-password-input').value;
        if (!val || val.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters long!');
          return false;
        }
        return val;
      }
    });

    if (newPassword) {
      try {
        await axios.put(`/auth/students/${student._id}/password`, { password: newPassword });
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Password updated successfully.',
          background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
          confirmButtonColor: '#10b981'
        });
      } catch (error) {
        console.error('Error updating password:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to update password',
          background: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
        });
      }
    }
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and view all registered students</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <select 
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="input-field max-w-[200px]"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div key={student._id} className="glass-panel p-6 flex flex-col hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 overflow-hidden">
                  {student.profileImage && student.profileImage !== 'default.jpg' ? (
                    <img src={student.profileImage} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold">{student.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate mr-2">{student.name}</h3>
                    <button
                      onClick={() => handleChangePassword(student)}
                      className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors shrink-0"
                      title="Change Password"
                    >
                      <Key size={16} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-wide">
                    {student.rollNumber || 'NO ROLL NUMBER'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-xl">
                  <Mail size={16} className="text-emerald-500 shrink-0" />
                  <a href={`mailto:${student.email}`} className="text-sm hover:text-emerald-600 truncate">{student.email}</a>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-xl">
                    <Phone size={16} className="text-emerald-500 shrink-0" />
                    <a href={`tel:${student.phone}`} className="text-sm hover:text-emerald-600">{student.phone}</a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2 pt-4 border-t border-slate-100 dark:border-white/10">
                {student.github ? (
                  <a href={student.github} target="_blank" rel="noreferrer" title="GitHub" className="p-2.5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 bg-slate-100 dark:bg-white/5 rounded-xl transition-colors">
                    <GitBranch size={18} />
                  </a>
                ) : <span className="p-2.5 flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-white/5 rounded-xl"><GitBranch size={18} /></span>}
                
                {student.linkedin ? (
                  <a href={student.linkedin} target="_blank" rel="noreferrer" title="LinkedIn" className="p-2.5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#0a66c2] bg-slate-100 dark:bg-white/5 rounded-xl transition-colors">
                    <Briefcase size={18} />
                  </a>
                ) : <span className="p-2.5 flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-white/5 rounded-xl"><Briefcase size={18} /></span>}

                {student.portfolio ? (
                  <a href={student.portfolio} target="_blank" rel="noreferrer" title="Portfolio" className="p-2.5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-emerald-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-colors">
                    <Globe size={18} />
                  </a>
                ) : <span className="p-2.5 flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-white/5 rounded-xl"><Globe size={18} /></span>}

                {student.leetcode ? (
                  <a href={student.leetcode} target="_blank" rel="noreferrer" title="LeetCode" className="p-2.5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#ffa116] bg-slate-100 dark:bg-white/5 rounded-xl transition-colors">
                    <Code size={18} />
                  </a>
                ) : <span className="p-2.5 flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-white/5 rounded-xl"><Code size={18} /></span>}
                
                {student.hackerrank ? (
                  <a href={student.hackerrank} target="_blank" rel="noreferrer" title="HackerRank" className="p-2.5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-[#2ec866] bg-slate-100 dark:bg-white/5 rounded-xl transition-colors">
                    <Terminal size={18} />
                  </a>
                ) : <span className="p-2.5 flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-white/5 rounded-xl"><Terminal size={18} /></span>}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full glass-panel p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            <UserIcon size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Students Found</h3>
            <p className="text-sm">We couldn't find any students matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
