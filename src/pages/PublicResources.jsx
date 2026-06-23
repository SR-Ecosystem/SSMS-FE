import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Search, ClipboardList, Briefcase, Code, Calendar, Award, ExternalLink, Download, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const stripHtml = (html) => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  } catch (e) {
    return html.replace(/<[^>]*>/g, '');
  }
};

const PublicResources = () => {
  const [data, setData] = useState({ tasks: [], leetcodeProblems: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, tasks, projects, leetcode
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  // Open task description in new tab with orange/black/white light theme styles
  const handleViewTask = (item) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${item.title}</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #fafafa;
              margin: 0;
              padding: 2rem;
              display: flex;
              justify-content: center;
            }
            .container {
              max-width: 800px;
              width: 100%;
              background-color: #ffffff;
              padding: 2.5rem;
              border-radius: 1rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
              border: 1px solid #e2e8f0;
            }
            h1 {
              color: #0f172a;
              margin-top: 0;
              font-size: 1.875rem;
              font-weight: 800;
              border-bottom: 2px solid #ea580c;
              padding-bottom: 0.75rem;
              margin-bottom: 1rem;
            }
            .meta-info {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              margin-bottom: 2rem;
              font-size: 0.875rem;
              color: #64748b;
            }
            .meta-item {
              background-color: #f8fafc;
              padding: 0.25rem 0.75rem;
              border-radius: 0.375rem;
              border: 1px solid #e2e8f0;
            }
            .meta-item strong {
              color: #ea580c;
            }
            .content {
              color: #1e293b;
              font-size: 1rem;
              overflow-wrap: break-word;
              word-break: break-word;
            }
            .content * {
              max-width: 100%;
              overflow-wrap: break-word;
              word-break: break-word;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              margin: 1.5rem 0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
            }
            pre {
              background-color: #f8fafc;
              padding: 1.25rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              border: 1px solid #e2e8f0;
              max-width: 100%;
            }
            code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              color: #ea580c;
              background-color: #f1f5f9;
              padding: 0.2rem 0.4rem;
              border-radius: 0.25rem;
              font-size: 0.875rem;
            }
            pre code {
              color: inherit;
              background-color: transparent;
              padding: 0;
              border-radius: 0;
              font-size: 0.875rem;
            }
            a {
              color: #ea580c;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            p {
              margin-top: 0;
              margin-bottom: 1rem;
            }
            ul, ol {
              margin-top: 0;
              margin-bottom: 1rem;
              padding-left: 1.5rem;
            }
            li {
              margin-bottom: 0.25rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${item.title}</h1>
            <div class="meta-info">
              <div class="meta-item">Type: <strong>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</strong></div>
              <div class="meta-item">Batch: <strong>${item.batchName}</strong></div>
              ${item.dueDate ? `<div class="meta-item">Deadline: <strong>${formatDate(item.dueDate)}</strong></div>` : ''}
              ${item.maxMarks !== undefined ? `<div class="meta-item">Marks: <strong>${item.maxMarks}</strong></div>` : ''}
            </div>
            <div class="content">
              ${item.description}
            </div>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch public allocated resources
      const { data: resData } = await axios.get('/public/allocated-resources');
      setData(resData);
    } catch (err) {
      console.error(err);
      setError('Failed to load training resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Format Dates Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Determine if dynamic deadline is closed
  const isDeadlinePassed = (deadlineStr) => {
    if (!deadlineStr) return false;
    return new Date(deadlineStr).getTime() < Date.now();
  };

  // Extract all unique batch options for filters
  const uniqueBatches = useMemo(() => {
    const batchesMap = {};
    
    data.tasks.forEach(task => {
      if (task.batchId && task.batchId._id) {
        batchesMap[task.batchId._id] = task.batchId.batchName;
      }
    });

    data.leetcodeProblems.forEach(problem => {
      if (problem.batchId && problem.batchId._id) {
        batchesMap[problem.batchId._id] = problem.batchId.batchName;
      }
    });

    return Object.entries(batchesMap).map(([id, name]) => ({ id, name }));
  }, [data]);

  // Aggregate and filter resources based on active filters
  const filteredItems = useMemo(() => {
    const items = [];

    // Add Tasks & Projects
    data.tasks.forEach(task => {
      const isProject = task.category === 'Project';
      const itemType = isProject ? 'project' : 'task';

      // Tab filter
      if (activeTab === 'all' || 
          (activeTab === 'tasks' && !isProject) || 
          (activeTab === 'projects' && isProject)) {
        
        // Search filter
        const matchesSearch = 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description || '').toLowerCase().includes(searchTerm.toLowerCase());

        // Batch filter
        const matchesBatch = !selectedBatch || (task.batchId && task.batchId._id === selectedBatch);

        if (matchesSearch && matchesBatch) {
          items.push({
            id: task._id,
            type: itemType,
            title: task.title,
            description: task.description || 'No description provided.',
            batchName: task.batchId?.batchName || 'Unknown Batch',
            dueDate: task.dueDate,
            maxMarks: task.maxMarks,
            category: task.category,
            taskType: task.taskType || 'text',
            fileUrl: task.fileUrl,
            linkUrl: task.linkUrl,
            createdAt: task.createdAt
          });
        }
      }
    });

    // Add LeetCode challenges
    if (activeTab === 'all' || activeTab === 'leetcode') {
      data.leetcodeProblems.forEach(prob => {
        const matchesSearch = prob.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBatch = !selectedBatch || (prob.batchId && prob.batchId._id === selectedBatch);

        if (matchesSearch && matchesBatch) {
          items.push({
            id: prob._id,
            type: 'leetcode',
            title: prob.title,
            description: 'Assigned LeetCode Coding Challenge.',
            batchName: prob.batchId?.batchName || 'Unknown Batch',
            dueDate: prob.deadline,
            problemLink: prob.problemLink,
            createdAt: prob.createdAt
          });
        }
      });
    }

    // Sort by creation date descending
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data, activeTab, searchTerm, selectedBatch]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <header className="bg-white border border-slate-200 p-8 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 id="public-curriculum-header" className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Curriculum Resources Directory
              </h1>
              <p className="text-orange-600 font-bold text-sm tracking-wide mt-1">
                maintained by Saran Velmurugan
              </p>
              <p className="text-slate-600 mt-2 font-medium text-sm sm:text-base max-w-2xl">
                Public access list of allocated curriculum tasks, project work specifications, and LeetCode coding problems across all active training cohorts.
              </p>
            </div>
            <button 
              id="refresh-btn"
              onClick={fetchResources}
              className="p-3 bg-slate-900 hover:bg-black text-white rounded-2xl transition-all cursor-pointer shadow-md shrink-0 flex items-center gap-2"
              title="Refresh Directory"
            >
              <RefreshCw size={18} className={loading ? "animate-spin text-orange-500" : ""} />
              <span className="text-sm font-bold">Sync Data</span>
            </button>
          </div>
        </header>

        {/* Filter Controls */}
        <section className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Tab Selection */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'tasks', label: 'Curriculum Tasks' },
              { id: 'projects', label: 'Allocated Projects' },
              { id: 'leetcode', label: 'LeetCode Challenges' }
            ].map(tab => (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resources..."
                className="w-full bg-white border border-slate-200 text-sm text-slate-900 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors placeholder-slate-400"
              />
            </div>

            {/* Batch Selector */}
            <select
              id="batch-select"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-48 bg-white border border-slate-200 text-sm text-slate-900 rounded-xl py-2.5 px-3 focus:outline-none focus:border-orange-500 transition-colors"
            >
              <option value="">All Batches</option>
              {uniqueBatches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Content Render */}
        {loading ? (
          <div className="opacity-60">
            <SkeletonLoader type="admin-dashboard" />
          </div>
        ) : error ? (
          <div className="bg-white p-12 text-center border border-rose-200 rounded-3xl shadow-sm max-w-lg mx-auto">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-rose-500 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sync Error</h2>
            <p className="text-sm text-rose-600 font-medium">{error}</p>
            <button 
              onClick={fetchResources}
              className="mt-6 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Try Reloading
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 p-16 rounded-3xl text-center max-w-xl mx-auto shadow-sm">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-400 animate-bounce" />
            <h3 className="text-xl font-black text-slate-900">No Resources Found</h3>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              No tasks, projects, or LeetCode challenges matching the active batch or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => {
              const isClosed = isDeadlinePassed(item.dueDate);
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-white border rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative overflow-hidden ${
                    item.type === 'leetcode'
                      ? 'border-orange-200 hover:border-orange-500'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {/* Decorative background glow for special cards */}
                  {item.type === 'project' && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-[100px] pointer-events-none"></div>
                  )}
                  {item.type === 'leetcode' && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-[100px] pointer-events-none"></div>
                  )}

                  {/* Header Area */}
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      {/* Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        item.type === 'leetcode'
                          ? 'bg-orange-50 text-orange-600 border-orange-100'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}>
                        {item.type === 'project' ? <Briefcase size={20} /> : item.type === 'leetcode' ? <Code size={20} /> : <ClipboardList size={20} />}
                      </div>

                      {/* Top Badges */}
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                          isClosed 
                            ? 'bg-slate-100 text-slate-500 border-slate-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                        }`}>
                          {isClosed ? 'Closed' : 'Active'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                          item.type === 'leetcode'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    </div>

                    {/* Batch Name */}
                    <span className="text-[10px] text-slate-550 font-bold uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block mb-3">
                      {item.batchName}
                    </span>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 line-clamp-2 leading-snug mb-2" title={item.title}>
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed mb-6 font-medium">
                      {stripHtml(item.description)}
                    </p>
                  </div>

                  {/* Footer & Details */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      {/* Due/Deadline Date */}
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar size={13} className="text-orange-500" />
                        <span>Deadline: <span className="text-slate-900 font-bold">{formatDate(item.dueDate)}</span></span>
                      </div>

                      {/* Score/Marks */}
                      {item.maxMarks !== undefined && (
                        <div className="flex items-center gap-1.5 font-medium shrink-0 ml-2">
                          <Award size={13} className="text-emerald-600" />
                          <span>Marks: <span className="text-slate-900 font-black">{item.maxMarks}</span></span>
                        </div>
                      )}
                    </div>

                    {/* Action Links */}
                    {item.type === 'leetcode' && item.problemLink && (
                      <a 
                        id={`solve-btn-${item.id}`}
                        href={item.problemLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20"
                      >
                        Solve Challenge <ExternalLink size={13} />
                      </a>
                    )}

                    {item.type !== 'leetcode' && (
                      <div className="flex flex-col gap-2">
                        {item.taskType === 'text' && (
                          <button
                            id={`view-task-btn-${item.id}`}
                            onClick={() => handleViewTask(item)}
                            className="w-full bg-slate-900 hover:bg-black text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <FileText size={13} /> View Task
                          </button>
                        )}
                        
                        {(item.fileUrl || item.linkUrl) && (
                          <div className="flex gap-2">
                            {item.fileUrl && (
                              <a 
                                id={`download-btn-${item.id}`}
                                href={item.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                              >
                                <Download size={13} /> Attachment
                              </a>
                            )}
                            {item.linkUrl && (
                              <a 
                                id={`link-btn-${item.id}`}
                                href={item.linkUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20"
                              >
                                Explore Link <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicResources;
