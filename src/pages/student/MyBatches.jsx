import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, BookOpen, Clock } from 'lucide-react';
import Loader from '../../components/Loader';

const MyBatches = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async () => {
    try {
      const { data } = await axios.get('/enrollments/my');
      setEnrollments(data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEnrollments(); }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Batches</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map(enr => (
          <div key={enr._id} className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-700 group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <BookOpen size={24} strokeWidth={2.5} />
              </div>
              <span className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${
                enr.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                enr.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
              }`}>
                {enr.status}
              </span>
            </div>
            
            <div className="relative z-10">
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-white mb-2">{enr.batchId?.batchName}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">{enr.batchId?.description}</p>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Clock size={14} className="text-indigo-400"/>
                  Joined {new Date(enr.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        {enrollments.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
            <BookOpen className="w-12 h-12 mb-3 text-slate-300" />
            <p>You have not joined any batches yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBatches;
