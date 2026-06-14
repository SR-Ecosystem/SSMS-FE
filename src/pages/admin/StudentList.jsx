import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Mail, Phone, GitBranch, Briefcase, Globe, Code, Terminal, Search, User as UserIcon } from 'lucide-react';
import Loader from '../../components/Loader';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
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
    fetchData();
  }, [selectedBatch]);

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate">{student.name}</h3>
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
