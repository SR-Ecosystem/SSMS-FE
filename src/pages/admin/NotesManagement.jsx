import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FileText, Plus, Edit, Trash2, Search, RefreshCw, X, ExternalLink, Link2, 
  Layers, User, Calendar, BookOpen
} from 'lucide-react';
import { MetalButton, LiquidButton } from '../../components/ui/liquid-glass-button';

const NotesManagement = () => {
  const [notes, setNotes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('All');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    batchId: '' // empty string means global
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/notes');
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
      Swal.fire('Error', 'Could not load notes catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data } = await axios.get('/batches');
      setBatches(data);
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchBatches();
  }, []);

  const openAddModal = () => {
    setEditingNote(null);
    setFormData({
      title: '',
      url: '',
      description: '',
      batchId: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      url: note.url || '',
      description: note.description || '',
      batchId: note.batchId?._id || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (note) => {
    const result = await Swal.fire({
      title: 'Delete Study Note?',
      text: `Are you sure you want to delete "${note.title}"? This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/notes/${note._id}`);
        fetchNotes();
        Swal.fire('Deleted!', 'Study note has been deleted.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Could not delete study note.', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      return Swal.fire('Validation Error', 'Title and URL are required.', 'warning');
    }

    try {
      if (editingNote) {
        // Edit Note
        await axios.put(`/notes/${editingNote._id}`, formData);
        Swal.fire({
          title: 'Success!',
          text: 'Study note updated successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Add Note
        await axios.post('/notes', formData);
        Swal.fire({
          title: 'Success!',
          text: 'Study note uploaded successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
      setModalOpen(false);
      fetchNotes();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save study note.', 'error');
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.url.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBatch = selectedBatchFilter === 'All' || 
      (selectedBatchFilter === 'Global' && !note.batchId) ||
      (note.batchId?._id === selectedBatchFilter);
    
    return matchesSearch && matchesBatch;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="text-theme-primary text-2xl" />
            Study Notes Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Upload document URLs, manage syllabus reference sheets, and assign class notes to specific batches.
          </p>
        </div>
        
        <MetalButton
          variant="gold"
          onClick={openAddModal}
          className="cursor-pointer shrink-0 flex items-center gap-2"
        >
          <Plus size={16} /> Upload Notes Link
        </MetalButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search notes by title, details or URL..."
            className="input-field pl-10 pr-4 py-2.5 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select
            className="input-field py-2.5 text-sm font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 rounded-xl cursor-pointer"
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
          >
            <option value="All">All Batches</option>
            <option value="Global">🌐 Global Only</option>
            {batches.map(batch => (
              <option key={batch._id} value={batch._id}>
                📦 {batch.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchNotes}
            disabled={loading}
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shrink-0 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-theme-primary opacity-65" />
          <p className="font-bold">Loading notes library...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 dark:text-slate-400 rounded-3xl">
          <FileText className="w-16 h-16 mx-auto mb-4 text-theme-primary opacity-30" />
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">No notes found</p>
          <p className="text-sm mt-1 font-medium">Try uploading a new notes resource or resetting search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <div 
              key={note._id} 
              className="bg-slate-900/40 dark:bg-slate-950/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 p-5 rounded-[28px] relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-slate-300/40 group"
            >
              <div>
                {/* Top Badge Section */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 text-slate-650 dark:text-slate-350 rounded-xl flex items-center gap-1`}>
                    <Layers size={11} /> {note.batchId ? note.batchId.name : '🌐 Global Notes'}
                  </span>
                  <a 
                    href={note.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-xl transition-all hover:scale-105"
                    title="Open Notes Document URL"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* Main Content Area */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                    <FileText size={24} className="stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-base leading-snug group-hover:text-theme-primary transition-colors truncate">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                      {note.description || 'No description or details provided.'}
                    </p>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="space-y-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="opacity-60" />
                    <span>Uploaded by: <strong className="text-slate-700 dark:text-slate-300">{note.uploadedBy?.name || 'Admin'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="opacity-60" />
                    <span>Date: <strong className="text-slate-700 dark:text-slate-300">{formatDate(note.createdAt)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/50 mt-4 items-center">
                <div className="flex-1 flex">
                  <MetalButton
                    variant="default"
                    onClick={() => openEditModal(note)}
                    className="w-full flex items-center justify-center text-xs cursor-pointer py-1 px-3"
                  >
                    <span className="flex items-center justify-center gap-1.5"><Edit size={12} /> Edit Note</span>
                  </MetalButton>
                </div>
                <div className="flex shrink-0">
                  <MetalButton
                    variant="error"
                    onClick={() => handleDelete(note)}
                    className="flex items-center justify-center px-3 cursor-pointer py-1"
                    title="Delete Note Link"
                  >
                    <Trash2 size={12} />
                  </MetalButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen className="text-theme-primary" size={20} />
                {editingNote ? 'Edit Study Note' : 'Upload Study Note'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Notes Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Database Normalization"
                  className="input-field py-2.5 px-4 text-sm w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary outline-none transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Link2 size={12} /> Notes Document URL (Google Drive, Notion, PDF, etc.)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  className="input-field py-2.5 px-4 font-mono text-sm w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary outline-none transition-all"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Target Batch (Optional)</label>
                <select
                  className="input-field py-2.5 px-4 text-sm w-full cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary transition-all"
                  value={formData.batchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchId: e.target.value }))}
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🌐 Global (All Batches & Students)</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      📦 {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Description / Details</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Practice questions, syllabus worksheets, reference guidelines..."
                  className="input-field py-2.5 px-4 text-sm w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-theme-primary/50 focus:border-theme-primary outline-none transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-850 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 font-bold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <LiquidButton
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-theme-primary to-theme-accent text-white font-extrabold text-sm rounded-xl hover:scale-[1.02] shadow-lg shadow-theme-primary/10 transition-transform cursor-pointer"
                >
                  {editingNote ? 'Save Changes' : 'Upload Link'}
                </LiquidButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesManagement;
