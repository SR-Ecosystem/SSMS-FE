import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ShieldCheck, Search, CheckCircle2, XCircle, Users, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader';

const CheckInPermissions = () => {
  const { themeColor, activeTheme } = useOutletContext();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [accessGrants, setAccessGrants] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grantingAccess, setGrantingAccess] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [accessFilter, setAccessFilter] = useState('all'); // all, on-site, wfh, none

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes] = await Promise.all([
        axios.get('/batches')
      ]);
      setBatches(batchesRes.data);
      
      // Select first batch if available and none selected yet
      if (batchesRes.data.length > 0 && !selectedBatch) {
        setSelectedBatch(batchesRes.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchStudentsAndAccess = async () => {
    if (!selectedBatch) return;
    try {
      setLoading(true);
      const [studentsRes, accessRes] = await Promise.all([
        axios.get(`/auth/students?batchId=${selectedBatch}`),
        axios.get(`/checkin-access/today?batchId=${selectedBatch}`).catch(() => ({ data: [] }))
      ]);
      setAllStudents(studentsRes.data);
      setAccessGrants(accessRes.data);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error fetching students and access grants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBatchStudentsAndAccess();
  }, [selectedBatch]);

  const handleGrantAccess = async (accessType) => {
    if (selectedStudents.length === 0) {
      Swal.fire('No Selection', 'Please select at least one student first.', 'warning');
      return;
    }
    setGrantingAccess(true);
    try {
      await axios.post('/checkin-access/grant', {
        studentIds: selectedStudents,
        accessType,
        batchId: selectedBatch
      });
      Swal.fire({
        title: 'Access Granted',
        text: `Granted ${accessType === 'wfh' ? 'Work From Home' : 'On-Site'} access for selected students.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setSelectedStudents([]);
      refreshAccessGrants();
    } catch (error) {
      console.error('Failed to grant access:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to grant check-in access.', 'error');
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (selectedStudents.length === 0) {
      Swal.fire('No Selection', 'Please select at least one student first.', 'warning');
      return;
    }
    setGrantingAccess(true);
    try {
      await axios.post('/checkin-access/revoke', {
        studentIds: selectedStudents,
        batchId: selectedBatch
      });
      Swal.fire({
        title: 'Access Revoked',
        text: 'Revoked check-in access for selected students.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setSelectedStudents([]);
      refreshAccessGrants();
    } catch (error) {
      console.error('Failed to revoke access:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to revoke check-in access.', 'error');
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleGrantAll = async (accessType) => {
    const targetStudents = filteredStudents.map(s => s._id);
    if (targetStudents.length === 0) {
      Swal.fire('No Students', 'No students match the current filters.', 'warning');
      return;
    }
    
    setGrantingAccess(true);
    try {
      await axios.post('/checkin-access/grant', {
        studentIds: targetStudents,
        accessType,
        batchId: selectedBatch
      });
      Swal.fire({
        title: 'Bulk Access Granted',
        text: `Granted ${accessType === 'wfh' ? 'WFH' : 'On-Site'} access to all ${targetStudents.length} filtered students.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      setSelectedStudents([]);
      refreshAccessGrants();
    } catch (error) {
      console.error('Failed to grant bulk access:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to grant check-in access.', 'error');
    } finally {
      setGrantingAccess(false);
    }
  };

  const refreshAccessGrants = async () => {
    try {
      const accessRes = await axios.get(`/checkin-access/today?batchId=${selectedBatch}`).catch(() => ({ data: [] }));
      setAccessGrants(accessRes.data);
    } catch (err) {
      console.error('Error refreshing access grants:', err);
    }
  };

  const getStudentAccess = (studentId) => {
    return accessGrants.find(g => {
      const sId = typeof g.studentId === 'object' && g.studentId !== null ? g.studentId._id : g.studentId;
      return sId === studentId;
    });
  };

  const handleToggleSelectStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredStudents.map(s => s._id);
    const allSelected = filteredIds.every(id => selectedStudents.includes(id));
    if (allSelected) {
      setSelectedStudents(selectedStudents.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedStudents([...new Set([...selectedStudents, ...filteredIds])]);
    }
  };

  // Filter students based on search and access filter
  const filteredStudents = allStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const access = getStudentAccess(student._id);
    const type = access ? access.accessType : 'none'; // 'on-site', 'wfh', 'none'
    
    let matchesAccess = true;
    if (accessFilter === 'on-site') matchesAccess = type === 'on-site';
    else if (accessFilter === 'wfh') matchesAccess = type === 'wfh';
    else if (accessFilter === 'none') matchesAccess = type === 'none';

    return matchesSearch && matchesAccess;
  });

  if (loading && batches.length === 0) return <Loader />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={28} />
            Check-In Permissions Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure, search, and authorize daily check-in access modes for students
          </p>
        </div>
        
        {/* Batch Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Batch:</span>
          <select
            className="w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <option value="">Choose Batch...</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Permission Grid Pattern */}
      <div className="glass-panel p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl pl-12 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center w-full md:w-auto overflow-x-auto shrink-0 pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Students' },
              { id: 'on-site', label: 'On-Site' },
              { id: 'wfh', label: 'WFH' },
              { id: 'none', label: 'No Access' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAccessFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  accessFilter === tab.id
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selection Status & Bulk Action Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
              {selectedStudents.length} of {filteredStudents.length} selected
            </span>
            {selectedStudents.length > 0 && (
              <button 
                onClick={() => setSelectedStudents([])}
                className="text-xs text-slate-400 hover:text-rose-500 hover:underline font-bold"
              >
                Clear Selection
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {selectedStudents.length === 0 ? (
              <>
                <button
                  onClick={() => handleGrantAll('on-site')}
                  disabled={grantingAccess || filteredStudents.length === 0}
                  className="px-4 py-2 text-xs font-black bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {grantingAccess && <Loader2 size={12} className="animate-spin" />}
                  Grant All On-Site
                </button>
                <button
                  onClick={() => handleGrantAll('wfh')}
                  disabled={grantingAccess || filteredStudents.length === 0}
                  className="px-4 py-2 text-xs font-black bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {grantingAccess && <Loader2 size={12} className="animate-spin" />}
                  Grant All WFH
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleGrantAccess('on-site')}
                  disabled={grantingAccess}
                  className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {grantingAccess && <Loader2 size={12} className="animate-spin" />}
                  Grant On-Site ({selectedStudents.length})
                </button>
                <button
                  onClick={() => handleGrantAccess('wfh')}
                  disabled={grantingAccess}
                  className="px-4 py-2 text-xs font-black bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-md shadow-sky-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {grantingAccess && <Loader2 size={12} className="animate-spin" />}
                  Grant WFH ({selectedStudents.length})
                </button>
                <button
                  onClick={handleRevokeAccess}
                  disabled={grantingAccess}
                  className="px-4 py-2 text-xs font-black bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {grantingAccess && <Loader2 size={12} className="animate-spin" />}
                  Revoke Access ({selectedStudents.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Student Grid list mimicking manual check list */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/10 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="font-bold text-slate-800 dark:text-slate-200">No Students Found</p>
            <p className="text-xs text-slate-500 mt-1">Select a different filter or check your query</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All Checkbox bar */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-3 select-none">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s._id))}
                  onChange={handleSelectAllFiltered}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                  id="select_all_list"
                />
                <label htmlFor="select_all_list" className="cursor-pointer">
                  Select All Filtered ({filteredStudents.length})
                </label>
              </div>
              <span>Access Status</span>
            </div>

            {/* Grid list of individual students */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => {
                const access = getStudentAccess(student._id);
                const isSelected = selectedStudents.includes(student._id);
                
                return (
                  <div
                    key={student._id}
                    onClick={() => handleToggleSelectStudent(student._id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group select-none ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-sm shadow-emerald-500/5'
                        : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Controlled by outer div click
                        className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                      />
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{student.rollNumber || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {access ? (
                        <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full border ${
                          access.accessType === 'wfh'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {access.accessType === 'wfh' ? 'WFH' : 'ON-SITE'}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                          NO ACCESS
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckInPermissions;
