import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
  FileText, Search, RefreshCw, ExternalLink, Calendar, User, 
  Layers, BookOpen, Download
} from 'lucide-react';

const StudentNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/notes');
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
      Swal.fire('Error', 'Could not load your study notes library.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes
  const filteredNotes = notes.filter(note => {
    return note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto pb-12">
      {/* Hero Header Banner */}
      <div className="relative bg-gradient-to-r from-theme-primary via-theme-primary/90 to-theme-accent p-8 rounded-3xl text-white shadow-xl shadow-theme-primary/15 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl -ml-12 -mb-12"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <BookOpen className="text-amber-300" size={32} /> Study Notes Library
            </h1>
            <p className="text-slate-100 mt-2 font-medium">
              Access your batch-specific and global reference guidelines, worksheets, and lecture notes.
            </p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center bg-white/10 border border-white/20 backdrop-blur-md px-5 py-3 rounded-2xl">
              <span className="text-2xl font-black text-amber-300">{notes.length}</span>
              <p className="text-[10px] text-slate-200 mt-0.5 font-bold uppercase tracking-wider">Total Docs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search notes by document title or details..."
            className="input-field pl-10 pr-4 py-2.5 text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={fetchNotes}
          disabled={loading}
          className="p-2.5 bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shrink-0 cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-theme-primary opacity-65" />
          <p className="font-bold">Loading your study documents...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-panel p-16 text-center text-slate-500 dark:text-slate-400 rounded-3xl">
          <FileText className="w-16 h-16 mx-auto mb-4 text-theme-primary opacity-30" />
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200">No notes found</p>
          <p className="text-sm mt-1 font-medium">No study notes have been shared with your batch yet.</p>
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
                    <span>Uploaded by: <strong className="text-slate-700 dark:text-slate-300">{note.uploadedBy?.name || 'Instructor'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="opacity-60" />
                    <span>Date Shared: <strong className="text-slate-700 dark:text-slate-300">{formatDate(note.createdAt)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                <a
                  href={note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 flex items-center justify-center gap-2 font-extrabold text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl transition-all border border-transparent hover:scale-[1.02] cursor-pointer"
                >
                  <ExternalLink size={14} /> Open Notes Document
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentNotes;
