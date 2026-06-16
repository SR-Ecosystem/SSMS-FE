import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Users, Plus, Edit, Trash2, Loader2, Calendar, UserMinus, X, Download, Clock } from 'lucide-react';
import Loader from '../../components/Loader';

const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    batchName: '', description: '', startDate: '', endDate: '', status: 'Upcoming', checkInTime: '', checkOutTime: ''
  });
  const [editingId, setEditingId] = useState(null);
  
  // Student Modal State
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchStudents, setBatchStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const fetchBatches = async () => {
    try {
      const { data } = await axios.get('/batches');
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatches(); }, []);

  const handleEdit = (batch) => {
    let formattedStartDate = '';
    let formattedEndDate = '';
    
    try {
      if (batch.startDate) formattedStartDate = new Date(batch.startDate).toISOString().split('T')[0];
    } catch (e) {
      console.warn("Invalid start date", batch.startDate);
    }
    
    try {
      if (batch.endDate) formattedEndDate = new Date(batch.endDate).toISOString().split('T')[0];
    } catch (e) {
      console.warn("Invalid end date", batch.endDate);
    }

    setFormData({
      batchName: batch.batchName || '',
      description: batch.description || '',
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      status: batch.status || 'Upcoming',
      checkInTime: batch.checkInTime || '',
      checkOutTime: batch.checkOutTime || ''
    });
    setEditingId(batch._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/batches/${editingId}`, formData);
      } else {
        await axios.post('/batches', formData);
      }
      setShowModal(false);
      setFormData({ batchName: '', description: '', startDate: '', endDate: '', status: 'Upcoming', checkInTime: '', checkOutTime: '' });
      setEditingId(null);
      fetchBatches();
    } catch (error) {
      console.error('Error saving batch:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/batches/${id}`);
        fetchBatches();
        Swal.fire('Deleted!', 'The batch has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Could not delete batch.', 'error');
      }
    }
  };

  const handleDownloadReport = async (batchId, batchName) => {
    try {
      const { data } = await axios.get(`/batches/${batchId}/report`);
      
      if (!data || data.length === 0) {
        Swal.fire('No Data', 'There are no students joined in this batch yet.', 'info');
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of data) {
        const values = headers.map(header => {
          const escaped = ('' + row[header]).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${batchName.replace(/\s+/g, '_')}_Report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error downloading report:', error);
      Swal.fire('Error', 'Could not download the report.', 'error');
    }
  };

  const openStudentsModal = async (batch) => {
    setSelectedBatch(batch);
    setShowStudentsModal(true);
    setStudentsLoading(true);
    try {
      const { data } = await axios.get(`/enrollments/batch/${batch._id}`);
      setBatchStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId) => {
    const result = await Swal.fire({
      title: 'Remove student?',
      text: "This student will be removed from the batch.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove them!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/enrollments/${enrollmentId}`);
        setBatchStudents(prev => prev.filter(enr => enr._id !== enrollmentId));
        Swal.fire('Removed!', 'The student has been removed from the batch.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Could not remove student.', 'error');
      }
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Management</h1>
        <button onClick={() => { setFormData({ batchName: '', description: '', startDate: '', endDate: '', status: 'Upcoming', checkInTime: '', checkOutTime: '' }); setEditingId(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> Create Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => (
          <div key={batch._id} className="glass-panel p-6 card-hover flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{batch.batchName}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                batch.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                batch.status === 'Completed' ? 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200' :
                'bg-blue-100 text-blue-700'
              }`}>
                {batch.status}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 flex-1">{batch.description}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1"><Calendar size={16}/> {new Date(batch.startDate).toLocaleDateString()}</div>
                <span>to</span>
                <div className="flex items-center gap-1"><Calendar size={16}/> {new Date(batch.endDate).toLocaleDateString()}</div>
              </div>
              {(batch.checkInTime || batch.checkOutTime) && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Clock size={16}/> {batch.checkInTime || '--:--'} - {batch.checkOutTime || '--:--'}
                </div>
              )}
            </div>
            <div className="flex gap-2 w-full mb-4">
              <button 
                onClick={() => openStudentsModal(batch)}
                className="flex-1 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Users size={16} /> Students
              </button>
              <button 
                onClick={() => handleDownloadReport(batch._id, batch.batchName)}
                className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-emerald-100 dark:border-emerald-800"
              >
                <Download size={16} /> Report
              </button>
            </div>
            <div className="flex items-center gap-2 mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
              <button onClick={() => handleEdit(batch)} className="text-primary-600 hover:text-primary-700 p-2 rounded-md hover:bg-primary-50 transition-colors">
                <Edit size={18} />
              </button>
              <button onClick={() => handleDelete(batch._id)} className="text-red-500 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors ml-auto">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingId ? 'Edit Batch' : 'Create New Batch'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Batch Name</label>
                <input required type="text" className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={formData.batchName} onChange={e => setFormData({...formData, batchName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Description</label>
                <textarea required className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Start Date</label>
                  <input required type="date" className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">End Date</label>
                  <input required type="date" className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 ml-1">Check-in Time</label>
                  <input type="time" className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={formData.checkInTime} onChange={e => setFormData({...formData, checkInTime: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 ml-1">Check-out Time</label>
                  <input type="time" className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={formData.checkOutTime} onChange={e => setFormData({...formData, checkOutTime: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 ml-1">Status</label>
                <select className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : (editingId ? 'Update Batch' : 'Create Batch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentsModal && selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Students in {selectedBatch.batchName}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage joined students for this batch</p>
              </div>
              <button onClick={() => setShowStudentsModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300 bg-white p-2 rounded-full shadow-sm">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {studentsLoading ? (
                <Loader />
              ) : batchStudents.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No students have joined this batch yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batchStudents.map(enr => (
                    <div key={enr._id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-primary-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex flex-shrink-0 items-center justify-center font-bold">
                          {enr.studentId?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{enr.studentId?.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{enr.studentId?.email}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveStudent(enr._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <UserMinus size={16} /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
