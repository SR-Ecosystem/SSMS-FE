import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader';
import { Check, Loader2 } from 'lucide-react';

const BatchTracker = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [trackerData, setTrackerData] = useState({ students: [], tasks: [], submissions: [] });
  const [toggling, setToggling] = useState(null); // { studentId, taskId }

  useEffect(() => {
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
    fetchBatches();
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    const fetchTrackerData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/tasks/tracker/${selectedBatch}`);
        setTrackerData(res.data);
      } catch (error) {
        console.error('Failed to fetch tracker data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrackerData();
  }, [selectedBatch]);

  const handleToggle = async (studentId, taskId, isCurrentlyCompleted) => {
    setToggling(`${studentId}-${taskId}`);
    try {
      await axios.post('/tasks/tracker/toggle', {
        studentId,
        taskId,
        completed: !isCurrentlyCompleted
      });
      
      // Optimistically update UI
      setTrackerData(prev => {
        let newSubs;
        if (!isCurrentlyCompleted) {
          // Add fake submission
          newSubs = [...prev.submissions, { studentId, taskId, status: 'graded' }];
        } else {
          // Remove submission
          newSubs = prev.submissions.filter(s => !(s.studentId === studentId && s.taskId === taskId));
        }
        return { ...prev, submissions: newSubs };
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update submission status', 'error');
    } finally {
      setToggling(null);
    }
  };

  // Group tasks by date
  const groupedTasks = {};
  trackerData.tasks.forEach(task => {
    const dateStr = new Date(task.dueDate).toLocaleDateString('en-GB'); // DD/MM/YYYY
    if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
    groupedTasks[dateStr].push(task);
  });
  
  const dates = Object.keys(groupedTasks);

  if (loading && !selectedBatch) return <Loader />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Task Tracker</h1>
        <select 
          className="input-field max-w-[300px]"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          {batches.map(b => (
            <option key={b._id} value={b._id}>{b.batchName}</option>
          ))}
        </select>
      </div>

      <div className="glass-panel p-0 overflow-hidden border border-slate-200 dark:border-slate-700/50 rounded-xl relative shadow-sm">
        {loading && selectedBatch ? (
          <div className="p-12"><Loader /></div>
        ) : trackerData.students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No students found in this batch.</div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-20">
                {/* FIRST HEADER ROW (DATES) */}
                <tr>
                  <th scope="col" rowSpan={2} className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Student Name
                  </th>
                  <th scope="col" rowSpan={2} className="px-6 py-4 border-b border-r dark:border-slate-700 sticky left-[200px] bg-slate-100 dark:bg-slate-800 z-30 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Roll Number
                  </th>
                  {dates.map(date => (
                    <th key={date} colSpan={groupedTasks[date].length} className="px-4 py-2 border-b border-r dark:border-slate-700 text-center font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                      {date}
                    </th>
                  ))}
                  {dates.length === 0 && <th rowSpan={2} className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">No Tasks Assigned</th>}
                </tr>
                {/* SECOND HEADER ROW (CW/HW) */}
                <tr>
                  {dates.map(date => (
                    groupedTasks[date].map(task => (
                      <th key={task._id} title={task.title} className="px-2 py-2 border-b border-r dark:border-slate-700 text-center min-w-[60px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
                        {task.category === 'General' ? 'Gen' : task.category}
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody>
                {trackerData.students.map((student, idx) => (
                  <tr key={student._id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'} hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors`}>
                    <td className="px-6 py-3 border-b border-r dark:border-slate-700 font-medium text-slate-900 dark:text-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-inherit">
                      {student.name}
                    </td>
                    <td className="px-6 py-3 border-b border-r dark:border-slate-700 text-slate-600 dark:text-slate-400 sticky left-[200px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] bg-inherit">
                      {student.rollNumber}
                    </td>
                    {dates.map(date => (
                      groupedTasks[date].map(task => {
                        const isCompleted = trackerData.submissions.some(s => s.studentId === student._id && s.taskId === task._id);
                        const isToggling = toggling === `${student._id}-${task._id}`;
                        
                        return (
                          <td key={task._id} className="px-2 py-3 border-b border-r dark:border-slate-700 text-center relative group">
                            <button
                              onClick={() => handleToggle(student._id, task._id, isCompleted)}
                              disabled={isToggling}
                              className={`w-6 h-6 mx-auto rounded-md flex items-center justify-center border transition-all duration-200 cursor-pointer ${
                                isCompleted 
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30 hover:bg-emerald-600' 
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-400 dark:hover:border-emerald-500'
                              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isToggling ? (
                                <Loader2 size={12} className="animate-spin text-slate-400" />
                              ) : (
                                <Check size={14} className={isCompleted ? 'opacity-100' : 'opacity-0'} strokeWidth={3} />
                              )}
                            </button>
                            {/* Tooltip for the specific task */}
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap z-50">
                              {task.title}
                            </div>
                          </td>
                        );
                      })
                    ))}
                    {dates.length === 0 && <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500"></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTracker;
