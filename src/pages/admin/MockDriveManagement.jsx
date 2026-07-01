import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Plus, Trash2, Award, Upload, Download, Loader2, Search, Check, AlertCircle, RefreshCw, Eye, X, Save, Edit3 } from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';

const formatScore = (val) => {
  if (val === undefined || val === null) return 'N/A';
  if (isNaN(val)) return '0';
  return String(Math.round((Number(val) + Number.EPSILON) * 100) / 100);
};

const MockDriveManagement = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [mockDrives, setMockDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Upload & Matching State
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedUploadBatch, setSelectedUploadBatch] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [unmatchedStudents, setUnmatchedStudents] = useState([]);
  const [parsedMaxMarks, setParsedMaxMarks] = useState(749);
  
  // Details Modal State
  const [activeMockDrive, setActiveMockDrive] = useState(null);
  const [scoresList, setScoresList] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Score Editing State
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editAptitude, setEditAptitude] = useState(0);
  const [editMcq, setEditMcq] = useState(0);
  const [editCoding, setEditCoding] = useState(0);
  const [editTechHr, setEditTechHr] = useState(0);
  const [editHr, setEditHr] = useState(0);
  const [editGrade, setEditGrade] = useState('Fail');
  const [editAttended, setEditAttended] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: batchRes } = await axios.get('/batches');
      setBatches(batchRes);
      if (batchRes.length > 0) {
        setSelectedBatch(batchRes[0]._id);
        setSelectedUploadBatch(batchRes[0]._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchMockDrives = async () => {
    if (!selectedBatch) return;
    try {
      const { data } = await axios.get(`/mock-drives/batch/${selectedBatch}`);
      setMockDrives(data);
    } catch (error) {
      console.error('Error fetching mock drives:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockDrives();
  }, [selectedBatch]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Mock Drive?',
      text: 'All student marks for this mock drive will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/mock-drives/${id}`);
        Swal.fire('Deleted!', 'Mock drive has been removed.', 'success');
        fetchMockDrives();
      } catch (error) {
        Swal.fire('Error', 'Could not delete mock drive.', 'error');
      }
    }
  };

  const handleExcelParse = async (e) => {
    e.preventDefault();
    if (!uploadFile) return Swal.fire('Error', 'Please select an Excel file', 'error');
    if (!selectedUploadBatch) return Swal.fire('Error', 'Please select a batch', 'error');

    setParsing(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('batchId', selectedUploadBatch);

    try {
      const { data } = await axios.post('/mock-drives/parse-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setParsedRows(data.rows);
      setUnmatchedStudents(data.unmatchedStudents);
      setParsedMaxMarks(data.maxMarks || 749);
      Swal.fire('Excel Parsed', 'Verify student mappings before saving.', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to parse Excel file', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleManualStudentLink = (rowIndex, studentId) => {
    const student = unmatchedStudents.find(s => s._id === studentId);
    if (!student) return;

    // Link student to the row
    setParsedRows(prev => prev.map(row => {
      if (row.id === rowIndex) {
        return { ...row, matchedStudent: student };
      }
      return row;
    }));

    // Remove student from unmatched list
    setUnmatchedStudents(prev => prev.filter(s => s._id !== studentId));
  };

  const handleSaveMockDrive = async () => {
    if (!uploadTitle.trim()) return Swal.fire('Error', 'Mock drive title is required', 'error');
    if (parsedRows.length === 0) return Swal.fire('Error', 'No parsed data to save', 'error');

    setSaving(true);
    // Prepare scores array
    const scores = parsedRows.map(row => ({
      studentId: row.matchedStudent ? row.matchedStudent._id : null,
      rowData: row.rowData
    }));

    try {
      await axios.post('/mock-drives', {
        title: uploadTitle,
        batchId: selectedUploadBatch,
        maxMarks: parsedMaxMarks,
        scores
      });
      
      Swal.fire('Success', 'Mock drive saved successfully', 'success');
      setShowUploadModal(false);
      // Reset upload modal states
      setUploadTitle('');
      setUploadFile(null);
      setParsedRows([]);
      setUnmatchedStudents([]);
      fetchMockDrives();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save mock drive', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMockDrive = async (drive) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Mock Drive Details',
      html:
        `<div class="space-y-4 text-left">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Mock Drive Title</label>
            <input id="swal-input-title" class="swal2-input !mt-0 !mx-0 !w-full" value="${drive.title}" placeholder="Mock Drive Title">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1">Max Marks</label>
            <input id="swal-input-maxmarks" type="number" class="swal2-input !mt-0 !mx-0 !w-full" value="${drive.maxMarks}" placeholder="Max Marks">
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const title = document.getElementById('swal-input-title').value.trim();
        const maxMarks = document.getElementById('swal-input-maxmarks').value.trim();
        if (!title) {
          Swal.showValidationMessage('Mock drive title is required');
          return false;
        }
        return { title, maxMarks: Number(maxMarks) || 749 };
      }
    });

    if (formValues) {
      try {
        await axios.put(`/mock-drives/${drive._id}`, formValues);
        Swal.fire('Updated!', 'Mock drive details updated successfully.', 'success');
        fetchMockDrives();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to update mock drive details', 'error');
      }
    }
  };

  const handleViewDetails = async (drive) => {
    setActiveMockDrive(drive);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    setEditingStudentId(null);
    try {
      const { data } = await axios.get(`/mock-drives/${drive._id}/scores`);
      setScoresList(data);
    } catch (error) {
      console.error('Error fetching mock drive scores:', error);
      Swal.fire('Error', 'Could not fetch score records.', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStartEdit = (score) => {
    setEditingStudentId(score.studentId?._id || score.studentId);
    setEditAptitude(score.aptitude);
    setEditMcq(score.mcq);
    setEditCoding(score.coding);
    setEditTechHr(score.techHr);
    setEditHr(score.hr);
    setEditGrade(score.grade);
    setEditAttended(score.attended);
  };

  const handleUpdateScore = async (studentId) => {
    if (!activeMockDrive) return;
    
    const aptVal = editAptitude === null || editAptitude === '' || isNaN(editAptitude) ? null : Number(editAptitude);
    const mcqVal = editMcq === null || editMcq === '' || isNaN(editMcq) ? null : Number(editMcq);
    const codingNum = Number(editCoding) || 0;
    const techHrNum = Number(editTechHr) || 0;
    const hrNum = Number(editHr) || 0;
    const total = (aptVal || 0) + (mcqVal || 0) + codingNum + techHrNum + hrNum;
    const maxMarks = activeMockDrive.maxMarks || 749;
    const pct = Math.round((total / maxMarks) * 105) / 105; // just rounding
    const pctInt = Math.round((total / maxMarks) * 100);

    try {
      await axios.put(`/mock-drives/${activeMockDrive._id}/score`, {
        studentId,
        aptitude: aptVal,
        mcq: mcqVal,
        coding: codingNum,
        techHr: techHrNum,
        hr: hrNum,
        totalMarks: total,
        percentage: pctInt,
        grade: editGrade,
        attended: editAttended
      });

      Swal.fire('Success', 'Student score record updated successfully.', 'success');
      setEditingStudentId(null);
      // Refresh details
      const { data } = await axios.get(`/mock-drives/${activeMockDrive._id}/scores`);
      setScoresList(data);
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to update score.', 'error');
    }
  };

  if (loading && batches.length === 0) return <SkeletonLoader type="card-grid" />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mock Drive Reports</h1>
          <p className="text-slate-500 mt-1 font-medium">Upload Excel mock drives and track student placement performances</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setUploadTitle('');
              setUploadFile(null);
              setParsedRows([]);
              setUnmatchedStudents([]);
              setShowUploadModal(true);
            }} 
            className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/30"
          >
            <Plus size={20} /> Upload Mock Drive
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <select 
          className="input-field py-1.5 text-sm w-full sm:w-auto min-w-[200px]"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          {batches.map(b => (
            <option key={b._id} value={b._id}>{b.batchName}</option>
          ))}
        </select>
        <button
          onClick={fetchMockDrives}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors"
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Mock Drives Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDrives.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center text-slate-500 dark:text-slate-400">
            <Award className="w-16 h-16 mx-auto mb-4 text-slate-400 opacity-50 animate-pulse" />
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200">No mock drives uploaded</p>
            <p className="text-sm mt-1 font-medium text-slate-400">Upload your first weekly mock drive reports to see analytics here.</p>
          </div>
        ) : (
          mockDrives.map(drive => (
            <div key={drive._id} className="glass-panel p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white leading-snug">{drive.title}</h3>
                <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  MAX {drive.maxMarks}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
                Uploaded on: {new Date(drive.date || drive.createdAt).toLocaleDateString()} <br />
                Created by: {drive.createdBy?.name || 'Admin'}
              </p>
              
              <div className="pt-4 border-t border-slate-100 dark:border-white/10 mt-auto flex items-center justify-between">
                <button
                  onClick={() => handleViewDetails(drive)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                >
                  <Eye size={14} /> View Scores
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditMockDrive(drive)}
                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Edit Details"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(drive._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload & Matching Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Upload className="text-emerald-500" size={24} /> Upload Mock Drive Results
              </h2>
              <button 
                onClick={() => setShowUploadModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-extrabold text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Form Input Section */}
              <form onSubmit={handleExcelParse} className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Mock Drive Title</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Mock Test 1"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-sm"
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Target Batch</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-sm"
                    value={selectedUploadBatch}
                    onChange={e => setSelectedUploadBatch(e.target.value)}
                  >
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.batchName}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-3 w-full">
                    <input 
                      required
                      type="file" 
                      accept=".xlsx,.xls"
                      onChange={e => setUploadFile(e.target.files[0])}
                      className="hidden" 
                      id="upload-mock-file"
                    />
                    <label 
                      htmlFor="upload-mock-file"
                      className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-black/20 dark:hover:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-center text-sm font-semibold text-slate-600 dark:text-slate-300 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {uploadFile ? uploadFile.name : 'Choose Excel File'}
                    </label>
                    <button 
                      type="submit" 
                      disabled={parsing}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
                    >
                      {parsing ? <Loader2 size={16} className="animate-spin" /> : 'Parse'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Parsing Results Review */}
              {parsedRows.length > 0 && (
                <div className="space-y-6">
                  {/* Summary Alert */}
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3">
                    <Check size={20} />
                    <span className="font-bold text-sm">
                      Successfully parsed {parsedRows.length} rows. {unmatchedStudents.length} students in the database batch were not matched in the sheet (they will receive 0 marks).
                      <strong className="block mt-1 text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-350">
                        Detected Max Marks: {parsedMaxMarks}
                      </strong>
                    </span>
                  </div>

                  {/* Student Matching List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Verify Student Mappings</h3>
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-6 py-4">Sheet Email</th>
                              <th className="px-6 py-4">Sheet Name</th>
                              <th className="px-6 py-4 text-center">Marks (Apt/Tech/Coding/TechHR/HR/Total)</th>
                              <th className="px-6 py-4">Match Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {parsedRows.map((row) => (
                              <tr key={row.id} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 transition-colors duration-200">
                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{row.rowData.studentEmail}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{row.rowData.studentName}</td>
                                <td className="px-6 py-4 text-center font-bold text-emerald-500">
                                  {formatScore(row.rowData.aptitude)} / {formatScore(row.rowData.mcq)} / {formatScore(row.rowData.coding)} / {formatScore(row.rowData.techHr)} / {formatScore(row.rowData.hr)} = <span className="text-indigo-500 dark:text-indigo-400">{formatScore(row.rowData.totalMarks)}</span>
                                </td>
                                <td className="px-6 py-4">
                                  {row.matchedStudent ? (
                                    <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 max-w-max">
                                      <Check size={14} /> Linked to {row.matchedStudent.name} ({row.matchedStudent.rollNumber})
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1.5 text-rose-500 font-bold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 whitespace-nowrap">
                                        <AlertCircle size={14} /> Unmatched
                                      </div>
                                      
                                      {/* Dropdown to link manually */}
                                      <select 
                                        className="px-3 py-1 bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
                                        onChange={(e) => handleManualStudentLink(row.id, e.target.value)}
                                        defaultValue=""
                                      >
                                        <option value="" disabled>Link manually...</option>
                                        {unmatchedStudents.map(s => (
                                          <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex justify-end gap-4 bg-slate-50 dark:bg-slate-950/20">
              <button 
                type="button" 
                onClick={() => setShowUploadModal(false)} 
                className="px-6 py-3 font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMockDrive} 
                disabled={saving || parsedRows.length === 0}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-2 text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirm & Save Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details / Edit Scores Modal */}
      {showDetailsModal && activeMockDrive && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[98vw] h-[95vh] border border-slate-200 dark:border-slate-800 flex flex-col animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Award className="text-emerald-500" size={24} /> Mock Drive Report Details: {activeMockDrive.title}
              </h2>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-extrabold text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col min-h-0">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                  <p className="text-slate-500 font-semibold">Loading student score reports...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  <div className="flex-1 flex flex-col min-h-0 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="px-4 py-4">Student</th>
                            <th className="px-4 py-4">Roll Number</th>
                            <th className="px-4 py-4 text-center">Aptitude</th>
                            <th className="px-4 py-4 text-center">Tech MCQ</th>
                            <th className="px-4 py-4 text-center">Coding</th>
                            <th className="px-4 py-4 text-center">Tech HR</th>
                            <th className="px-4 py-4 text-center">HR</th>
                            <th className="px-4 py-4 text-center">Total</th>
                            <th className="px-4 py-4 text-center">Percentage</th>
                            <th className="px-4 py-4 text-center">Grade</th>
                            <th className="px-4 py-4 text-center">Attended</th>
                            <th className="px-4 py-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {scoresList.length === 0 ? (
                            <tr>
                              <td colSpan="12" className="text-center py-8 text-slate-500 dark:text-slate-400">
                                No score records found.
                              </td>
                            </tr>
                          ) : (
                            scoresList.map((score) => {
                              const student = score.studentId || {};
                              const isEditing = editingStudentId === (student._id || student);

                              if (isEditing) {
                                return (
                                  <tr key={student._id || score._id} className="bg-indigo-50/50 dark:bg-indigo-900/10">
                                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{student.name || 'Unknown'}</td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{student.rollNumber || 'N/A'}</td>
                                    <td className="px-4 py-3 text-center">
                                      <input 
                                        type="text" 
                                        placeholder="N/A"
                                        className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500" 
                                        value={editAptitude === null ? '' : editAptitude} 
                                        onChange={e => setEditAptitude(e.target.value === '' ? null : e.target.value)} 
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input 
                                        type="text" 
                                        placeholder="N/A"
                                        className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500" 
                                        value={editMcq === null ? '' : editMcq} 
                                        onChange={e => setEditMcq(e.target.value === '' ? null : e.target.value)} 
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input 
                                        type="number" 
                                        className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500" 
                                        value={editCoding} 
                                        onChange={e => setEditCoding(e.target.value)} 
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input 
                                        type="number" 
                                        className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500" 
                                        value={editTechHr} 
                                        onChange={e => setEditTechHr(e.target.value)} 
                                      />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input 
                                        type="number" 
                                        className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500" 
                                        value={editHr} 
                                        onChange={e => setEditHr(e.target.value)} 
                                      />
                                    </td>
                                    <td className="px-4 py-3 font-black text-slate-800 dark:text-slate-200 text-center">
                                      {formatScore(
                                        (editAptitude === null || editAptitude === '' ? 0 : Number(editAptitude)) + 
                                        (editMcq === null || editMcq === '' ? 0 : Number(editMcq)) + 
                                        Number(editCoding) + 
                                        Number(editTechHr) + 
                                        Number(editHr)
                                      )}
                                    </td>
                                    <td className="px-4 py-3 font-black text-emerald-500 text-center">
                                      {formatScore((
                                        ((editAptitude === null || editAptitude === '' ? 0 : Number(editAptitude)) + 
                                         (editMcq === null || editMcq === '' ? 0 : Number(editMcq)) + 
                                         Number(editCoding) + 
                                         Number(editTechHr) + 
                                         Number(editHr)) / (activeMockDrive.maxMarks || 749)
                                      ) * 100)}%
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <select 
                                        className="px-2 py-1 bg-white dark:bg-slate-800 border rounded-lg text-sm" 
                                        value={editGrade} 
                                        onChange={e => setEditGrade(e.target.value)}
                                      >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                        <option value="Fail">Fail</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500" 
                                        checked={editAttended} 
                                        onChange={e => setEditAttended(e.target.checked)} 
                                      />
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-2 justify-center">
                                        <button 
                                          onClick={() => handleUpdateScore(student._id)} 
                                          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                                          title="Save"
                                        >
                                          <Save size={14} />
                                        </button>
                                        <button 
                                          onClick={() => setEditingStudentId(null)} 
                                          className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300"
                                          title="Cancel"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={student._id || score._id} className="hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 transition-colors duration-200">
                                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{student.name || 'Unknown'}</td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{student.rollNumber || 'N/A'}</td>
                                  <td className="px-4 py-3 text-center">{formatScore(score.aptitude)}</td>
                                  <td className="px-4 py-3 text-center">{formatScore(score.mcq)}</td>
                                  <td className="px-4 py-3 text-center">{formatScore(score.coding)}</td>
                                  <td className="px-4 py-3 text-center">{formatScore(score.techHr)}</td>
                                  <td className="px-4 py-3 text-center">{formatScore(score.hr)}</td>
                                  <td className="px-4 py-3 text-center font-bold text-indigo-500 dark:text-indigo-400">{formatScore(score.totalMarks)}</td>
                                  <td className="px-4 py-3 text-center font-bold text-emerald-500">{formatScore(score.percentage)}%</td>
                                  <td className="px-4 py-3 text-center font-medium">
                                    <span className={`px-2 py-0.5 rounded text-xs ${score.grade === 'Fail' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                                      {score.grade}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs ${score.attended ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                                      {score.attended ? 'Present' : 'Absent'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button 
                                      onClick={() => handleStartEdit(score)} 
                                      className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Score"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex justify-end bg-slate-50 dark:bg-slate-950/20">
              <button 
                type="button" 
                onClick={() => setShowDetailsModal(false)} 
                className="px-6 py-3 font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockDriveManagement;
