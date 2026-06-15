import { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from '../../components/Loader';
import { Check, Clock, X, RotateCcw, XCircle } from 'lucide-react';

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
      // Ensure defaults for backward compatibility
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

  // Apply date filter if selected
  if (filterDate) {
    const [y, m, d] = filterDate.split('-');
    allActivities = allActivities.filter(a => {
      return a.dateVal.getFullYear() === parseInt(y) &&
             a.dateVal.getMonth() + 1 === parseInt(m) &&
             a.dateVal.getDate() === parseInt(d);
    });
  }

  // Sort chronologically
  allActivities.sort((a, b) => a.dateVal - b.dateVal);

  // Group by date
  const groupedTasks = {};
  allActivities.forEach(task => {
    const dateStr = task.dateVal.toLocaleDateString('en-GB'); // DD/MM/YYYY
    if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
    groupedTasks[dateStr].push(task);
  });
  
  const dates = Object.keys(groupedTasks);

  if (loading && !selectedBatch) return <Loader />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Task Tracker</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center"><Check size={12} className="text-white" strokeWidth={3} /></div> Graded / LC Submitted
             </div>
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-amber-400 rounded flex items-center justify-center"><Clock size={12} className="text-white" strokeWidth={3} /></div> Submitted (Not Graded)
             </div>
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-rose-500 rounded flex items-center justify-center"><X size={12} className="text-white" strokeWidth={3} /></div> Not Submitted
             </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input 
              type="date"
              className="input-field"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded hover:bg-rose-100 transition-colors"
                title="Clear Date Filter"
              >
                <XCircle size={20} />
              </button>
            )}
          </div>
          <select 
            className="input-field min-w-[200px]"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            {batches.map(b => (
              <option key={b._id} value={b._id}>{b.batchName}</option>
            ))}
          </select>
          <button 
            onClick={fetchTrackerData}
            className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
            title="Reload Data"
          >
            <RotateCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass-panel p-0 overflow-hidden border border-slate-200 dark:border-slate-700/50 rounded-xl relative shadow-sm">
        {loading && selectedBatch ? (
          <div className="p-12"><Loader /></div>
        ) : trackerData.students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No students found in this batch.</div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-50">
                {/* FIRST HEADER ROW (DATES) */}
                <tr>
                  <th scope="col" rowSpan={2} className="px-4 py-4 border-b border-r dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-50 min-w-[60px] text-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    S.No
                  </th>
                  <th scope="col" rowSpan={2} className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-[60px] bg-slate-100 dark:bg-slate-800 z-50 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Student Name
                  </th>
                  <th scope="col" rowSpan={2} className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-[260px] bg-slate-100 dark:bg-slate-800 z-50 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Roll Number
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
                      <th key={task._id} title={`${task.isLeetCode ? 'LeetCode' : task.category}: ${task.title}`} className="px-4 py-2 border-b border-r dark:border-slate-700 text-center min-w-[120px] max-w-[160px] whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded mr-1 ${task.isLeetCode ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {task.isLeetCode ? 'LC' : task.category === 'General' ? 'Gen' : task.category}
                        </span>
                        {task.title}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {trackerData.students.map((student, idx) => {
                  const rowBg = idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50';
                  
                  return (
                    <tr key={student._id} className={`${rowBg} hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors`}>
                      <td className={`px-4 py-3 border-b border-r dark:border-slate-700 font-bold text-center text-slate-500 dark:text-slate-400 sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBg}`}>
                        {idx + 1}
                      </td>
                      <td className={`px-6 py-3 border-b border-r dark:border-slate-700 font-medium text-slate-900 dark:text-white sticky left-[60px] z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBg}`}>
                        {student.name}
                      </td>
                      <td className={`px-6 py-3 border-b border-r dark:border-slate-700 text-slate-600 dark:text-slate-400 sticky left-[260px] z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${rowBg}`}>
                        {student.rollNumber}
                      </td>
                      {dates.map(date => (
                        groupedTasks[date].map(task => {
                          let statusColor = 'bg-rose-500'; // Default Not Submitted
                          let Icon = X;
                          
                          if (task.isLeetCode) {
                            const isSubmitted = trackerData.leetcodeSubmissions.some(s => s.studentId === student._id && s.problemId === task._id);
                            if (isSubmitted) {
                              statusColor = 'bg-emerald-500';
                              Icon = Check;
                            }
                          } else {
                            const submission = trackerData.submissions.find(s => s.studentId === student._id && s.taskId === task._id);
                            if (submission) {
                              if (submission.status === 'graded') {
                                statusColor = 'bg-emerald-500';
                                Icon = Check;
                              } else {
                                statusColor = 'bg-amber-400';
                                Icon = Clock;
                              }
                            }
                          }
                          
                          return (
                            <td key={task._id} className="px-2 py-3 border-b border-r dark:border-slate-700 text-center relative group z-10">
                              <div className={`w-8 h-8 mx-auto rounded-md shadow-sm flex items-center justify-center ${statusColor}`}>
                                <Icon size={16} className="text-white" strokeWidth={3} />
                              </div>
                              
                              {/* Tooltip */}
                              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-50">
                                {task.title}
                              </div>
                            </td>
                          );
                        })
                      ))}
                      {dates.length === 0 && <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500"></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTracker;
