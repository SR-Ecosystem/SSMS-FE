import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Loader2, PlusCircle, Check, SearchX } from 'lucide-react';
import Loader from '../../components/Loader';

const AvailableBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestedMap, setRequestedMap] = useState({});

  const fetchBatches = async () => {
    try {
      // Fetch all batches and the student's enrollments simultaneously
      const [batchesRes, enrollmentsRes] = await Promise.all([
        axios.get('/batches'),
        axios.get('/enrollments/my')
      ]);
      
      const myEnrollments = enrollmentsRes.data;
      const enrolledBatchIds = myEnrollments.map(enr => enr.batchId?._id || enr.batchId);

      // Filter out batches that the student is already enrolled in (or requested)
      const availableOnly = batchesRes.data.filter(b => 
        (b.status === 'Upcoming' || b.status === 'Active') && !enrolledBatchIds.includes(b._id)
      );

      setBatches(availableOnly);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleRequest = async (batchId) => {
    try {
      await axios.post('/enrollments/request', { batchId });
      setRequestedMap(prev => ({...prev, [batchId]: true}));
      
      // Optionally remove the batch from the list immediately with an animation
      setTimeout(() => {
        setBatches(prev => prev.filter(b => b._id !== batchId));
      }, 1000);
      
      Swal.fire({
        title: 'Requested!',
        text: 'Your request to join the batch has been sent to the admin.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({ title: 'Error', text: error.response?.data?.message || 'Error requesting batch', icon: 'error' });
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Available Batches</h1>
      
      {batches.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
          <SearchX className="w-16 h-16 mb-4 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No new batches available</h2>
          <p className="max-w-md">You have already requested or joined all currently available batches, or there are no active batches at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map(batch => (
            <div 
              key={batch._id} 
              className={`glass-panel p-6 flex flex-col card-hover transition-all duration-500 ${requestedMap[batch._id] ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{batch.batchName}</h3>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">{batch.status}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 flex-1">{batch.description}</p>
              <button 
                onClick={() => handleRequest(batch._id)}
                disabled={requestedMap[batch._id]}
                className={`w-full py-2.5 rounded-xl font-medium transition-all flex justify-center items-center gap-2 ${
                  requestedMap[batch._id] 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                }`}
              >
                {requestedMap[batch._id] ? <><Check size={18} /> Request Sent!</> : <><PlusCircle size={18} /> Request to Join</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableBatches;
