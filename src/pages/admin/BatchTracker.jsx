import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Loader from '../../components/Loader';
import { Check, Clock, X, RotateCcw, XCircle, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const BatchTracker = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [trackerData, setTrackerData] = useState({ 
    students: [], 
    tasks: [], 
    submissions: [],
    leetcodeProblems: [],
    leetcodeSubmissions: [] 
  });
  
  const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD
  
  // Row Filters (Top bar)
  const [filterName, setFilterName] = useState('');
  const [filterRoll, setFilterRoll] = useState('');

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Column Visibility Filters
  const [visibleCategories, setVisibleCategories] = useState({
    'General': true,
    'HW': true,
    'CW': true,
    'Project': true,
    'LeetCode': true
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);

  const fetchBatches = async () => {
    try {
      const res = await axios.get('/batches');
      setBatches(res.data);
      if (res.data.length > 0) {
        setSelectedBatch(res.data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch batches', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchTrackerData = async () => {
    if (!selectedBatch) return;
    setLoading(true);
    try {
      const res = await axios.get(`/tasks/tracker/${selectedBatch}`);
      const data = {
        students: res.data.students || [],
        tasks: res.data.tasks || [],
        submissions: res.data.submissions || [],
        leetcodeProblems: res.data.leetcodeProblems || [],
        leetcodeSubmissions: res.data.leetcodeSubmissions || []
      };
      setTrackerData(data);
    } catch (error) {
      console.error('Failed to fetch tracker data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
    // Reset search filters on batch change
    setFilterName('');
    setFilterRoll('');
  }, [selectedBatch]);

  // Merge tasks and leetcode into a single array
  let allActivities = [
    ...trackerData.tasks.map(t => ({
      ...t, 
      isLeetCode: false,
      category: t.category,
      dateVal: new Date(t.dueDate)
    })),
    ...trackerData.leetcodeProblems.map(l => ({
      ...l,
      isLeetCode: true,
      category: 'LeetCode',
      dateVal: new Date(l.createdAt)
    }))
  ];

  // 1. Filter by Date
  if (filterDate) {
    const [y, m, d] = filterDate.split('-');
    allActivities = allActivities.filter(a => {
      return a.dateVal.getFullYear() === parseInt(y) &&
             a.dateVal.getMonth() + 1 === parseInt(m) &&
             a.dateVal.getDate() === parseInt(d);
    });
  }

  // 2. Filter Columns by Category
  allActivities = allActivities.filter(a => visibleCategories[a.category] !== false);

  allActivities.sort((a, b) => a.dateVal - b.dateVal);

  const groupedTasks = {};
  allActivities.forEach(task => {
    const dateStr = task.dateVal.toLocaleDateString('en-GB');
    if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
    groupedTasks[dateStr].push(task);
  });
  const dates = Object.keys(groupedTasks);

  // Helper to determine status color
  const getStatusColor = (studentId, task) => {
    if (task.isLeetCode) {
      const isSubmitted = trackerData.leetcodeSubmissions.some(s => s.studentId === studentId && s.problemId === task._id);
      return isSubmitted ? 'green' : 'red';
    } else {
      const submission = trackerData.submissions.find(s => s.studentId === studentId && s.taskId === task._id);
      if (submission) {
        return submission.status === 'graded' ? 'green' : 'yellow';
      }
      return 'red';
    }
  };

  // Apply row filters and sorting
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...trackerData.students];

    // Filter
    result = result.filter(student => {
      if (filterName && !student.name.toLowerCase().includes(filterName.toLowerCase())) {
        return false;
      }
      if (filterRoll && !student.rollNumber.toLowerCase().includes(filterRoll.toLowerCase())) {
        return false;
      }
      return true;
    });

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [trackerData.students, filterName, filterRoll, sortConfig]);

  const toggleCategory = (cat) => {
    setVisibleCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-slate-400 opacity-50 hover:opacity-100 transition-opacity" />;
    if (sortConfig.direction === 'asc') return <ArrowUp size={14} className="text-indigo-500" />;
    return <ArrowDown size={14} className="text-indigo-500" />;
  };

  if (loading && !selectedBatch) return <Loader />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header & Legend */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Batch Task Tracker</h1>
        <div className="mt-3 flex flex-wrap items-center gap-5 text-sm font-medium text-slate-600 dark:text-slate-300">
           <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center shadow-sm"><Check size={12} className="text-white" strokeWidth={3} /></div> Graded / LC Submitted
           </div>
           <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-amber-400 rounded flex items-center justify-center shadow-sm"><Clock size={12} className="text-white" strokeWidth={3} /></div> Submitted (Not Graded)
           </div>
           <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-rose-500 rounded flex items-center justify-center shadow-sm"><X size={12} className="text-white" strokeWidth={3} /></div> Not Submitted
           </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-wrap items-center gap-4">
        
        {/* Search Inputs */}
        <div className="flex-1 min-w-[200px] flex items-center gap-3">
          <input 
            type="text" 
            placeholder="Search student name..." 
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="input-field w-full sm:max-w-[200px]"
          />
          <input 
            type="text" 
            placeholder="Search roll number..." 
            value={filterRoll}
            onChange={(e) => setFilterRoll(e.target.value)}
            className="input-field w-full sm:max-w-[160px]"
          />
        </div>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden lg:block"></div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-1">
            <input 
              type="date"
              className="input-field cursor-pointer"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded transition-colors"
                title="Clear Date"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>
          
          <select 
            className="input-field min-w-[180px] font-medium"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>

          {/* Column Visibility Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowColumnFilters(!showColumnFilters)}
              className="px-4 py-2 flex items-center gap-2 font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 dark:border-indigo-800/50"
              title="Filter Columns"
            >
              <Filter size={16} /> Filter Columns
            </button>
            {showColumnFilters && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-[60]">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Show Task Types</h3>
                <div className="space-y-3">
                  {Object.keys(visibleCategories).map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        checked={visibleCategories[cat]}
                        onChange={() => toggleCategory(cat)}
                      />
                      {cat === 'General' ? 'Gen Tasks' : cat}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={fetchTrackerData}
            className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
            title="Reload Data"
          >
            <RotateCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tracker Table */}
      <div className="glass-panel p-0 overflow-hidden border border-slate-200 dark:border-slate-700/50 rounded-xl relative shadow-sm">
        {loading && selectedBatch ? (
          <div className="p-12"><Loader /></div>
        ) : trackerData.students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">No students found in this batch.</div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-50">
                {/* FIRST HEADER ROW (DATES) */}
                <tr>
                  <th scope="col" rowSpan={2} className="px-4 py-4 border-b border-r dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-50 min-w-[60px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    S.No
                  </th>
                  <th 
                    scope="col" 
                    rowSpan={2} 
                    className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-[60px] bg-slate-100 dark:bg-slate-800 z-50 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-between">
                      Student Name
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    rowSpan={2} 
                    className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-[260px] bg-slate-100 dark:bg-slate-800 z-50 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors group select-none"
                    onClick={() => handleSort('rollNumber')}
                  >
                    <div className="flex items-center justify-between">
                      Roll Number
                      {renderSortIcon('rollNumber')}
                    </div>
                  </th>
                  {dates.map(date => (
                    <th key={date} colSpan={groupedTasks[date].length} className="px-4 py-2 border-b border-r dark:border-slate-700 text-center font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300">
                      {date}
                    </th>
                  ))}
                  {dates.length === 0 && <th rowSpan={2} className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">No Assignments Found</th>}
                </tr>
                {/* SECOND HEADER ROW (TASK TITLES) */}
                <tr>
                  {dates.map(date => (
                    groupedTasks[date].map(task => (
                      <th key={task._id} title={`${task.isLeetCode ? 'LeetCode' : task.category}: ${task.title}`} className="px-4 py-3 border-b border-r dark:border-slate-700 text-center min-w-[120px] max-w-[160px] bg-slate-50 dark:bg-slate-800/80">
                        <div className="w-full whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded mr-1 flex-shrink-0 ${task.isLeetCode ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {task.isLeetCode ? 'LC' : task.category === 'General' ? 'Gen' : task.category}
                          </span>
                          <span className="truncate font-medium tracking-wide">{task.title}</span>
                        </div>
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={dates.length === 0 ? 4 : 3 + allActivities.length} className="px-6 py-8 text-center text-slate-500 bg-white dark:bg-slate-900 font-medium">
                      No students match the current search.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStudents.map((student, idx) => {
                    // IMPORTANT: We use completely opaque background colors here so that scrolling cells don't bleed through
                    const rowBgClass = idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800';
                    
                    return (
                      <tr key={student._id} className={`${rowBgClass} hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors`}>
                        <td className={`px-4 py-3 border-b border-r dark:border-slate-700 font-bold text-center text-slate-500 dark:text-slate-400 sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass}`}>
                          {idx + 1}
                        </td>
                        <td className={`px-6 py-3 border-b border-r dark:border-slate-700 font-medium text-slate-900 dark:text-white sticky left-[60px] z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass}`}>
                          {student.name}
                        </td>
                        <td className={`px-6 py-3 border-b border-r dark:border-slate-700 text-slate-600 dark:text-slate-400 sticky left-[260px] z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBgClass}`}>
                          {student.rollNumber}
                        </td>
                        {dates.map(date => (
                          groupedTasks[date].map(task => {
                            const statusType = getStatusColor(student._id, task);
                            let statusColor = 'bg-rose-500';
                            let Icon = X;
                            
                            if (statusType === 'green') {
                              statusColor = 'bg-emerald-500';
                              Icon = Check;
                            } else if (statusType === 'yellow') {
                              statusColor = 'bg-amber-400';
                              Icon = Clock;
                            }
                            
                            return (
                              <td key={task._id} className="px-2 py-3 border-b border-r dark:border-slate-700 text-center relative group z-10">
                                <div className={`w-8 h-8 mx-auto rounded-md shadow-sm flex items-center justify-center ${statusColor} transition-transform group-hover:scale-105`}>
                                  <Icon size={16} className="text-white" strokeWidth={3} />
                                </div>
                                
                                {/* Tooltip */}
                                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-medium rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                                  {task.title}
                                </div>
                              </td>
                            );
                          })
                        ))}
                        {dates.length === 0 && <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500"></td>}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTracker;
