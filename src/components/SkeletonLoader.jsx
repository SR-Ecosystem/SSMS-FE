import React from 'react';

const SkeletonLoader = ({ type = 'admin-dashboard' }) => {
  // Generic pulse item
  const PulseItem = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`} />
  );

  // 1. Admin Dashboard Skeleton
  if (type === 'admin-dashboard') {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <PulseItem className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <PulseItem className="w-40 h-6" />
              <PulseItem className="w-24 h-4" />
            </div>
          </div>
          <PulseItem className="w-10 h-10 rounded-xl" />
        </div>

        {/* Quick Links Grid */}
        <div className="glass-panel p-6">
          <PulseItem className="w-44 h-4 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between h-[110px] space-y-4">
                <div className="flex justify-between items-start">
                  <PulseItem className="w-10 h-10 rounded-xl" />
                  <div className="space-y-1">
                    <PulseItem className="w-10 h-2" />
                    <PulseItem className="w-8 h-4 ml-auto" />
                  </div>
                </div>
                <PulseItem className="w-20 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Charts & Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review status donut */}
          <div className="glass-panel p-6 flex flex-col h-[420px] justify-between">
            <div className="space-y-2">
              <PulseItem className="w-24 h-4" />
              <PulseItem className="w-36 h-3" />
            </div>
            <div className="flex flex-col items-center justify-center gap-8 mt-2 flex-1">
              <PulseItem className="w-36 h-36 rounded-full" />
              <div className="space-y-3 w-full px-2">
                <div className="flex justify-between"><PulseItem className="w-16 h-3" /><PulseItem className="w-8 h-3" /></div>
                <div className="flex justify-between"><PulseItem className="w-16 h-3" /><PulseItem className="w-8 h-3" /></div>
                <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-white/5"><PulseItem className="w-16 h-3" /><PulseItem className="w-8 h-3" /></div>
              </div>
            </div>
          </div>

          {/* Area Chart */}
          <div className="glass-panel p-6 flex flex-col h-[420px] justify-between">
            <div className="flex justify-between items-center mb-6">
              <PulseItem className="w-28 h-4" />
              <PulseItem className="w-20 h-7 rounded-full" />
            </div>
            <div className="flex-1 w-full flex items-end gap-2 pb-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <PulseItem className="w-full rounded-t-lg" style={{ height: `${20 + i * 10}%` }} />
                  <PulseItem className="w-8 h-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="glass-panel p-6 flex flex-col h-[420px] justify-between">
            <div className="flex justify-between items-center mb-6">
              <PulseItem className="w-32 h-4" />
              <PulseItem className="w-12 h-3" />
            </div>
            <div className="space-y-5 overflow-y-auto flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <PulseItem className="w-3 h-3 rounded-full mt-1.5" />
                  <div className="flex-1 space-y-2">
                    <PulseItem className="w-3/4 h-3" />
                    <PulseItem className="w-1/2 h-2" />
                  </div>
                  <PulseItem className="w-10 h-3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Student Dashboard Skeleton
  if (type === 'student-dashboard') {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <PulseItem className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <PulseItem className="w-40 h-6" />
              <PulseItem className="w-48 h-4" />
            </div>
          </div>
          <PulseItem className="w-36 h-12 rounded-2xl" />
        </div>

        {/* Row 1 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-6">
          {/* Task Completion Card */}
          <div className="md:col-span-4 lg:col-span-3 p-6 rounded-3xl bg-emerald-500/20 border border-emerald-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px]">
            <PulseItem className="w-28 h-4 bg-emerald-500/30" />
            <PulseItem className="w-24 h-24 rounded-full bg-emerald-500/30" />
            <div className="space-y-2 w-full px-4">
              <div className="flex justify-between"><PulseItem className="w-16 h-3 bg-emerald-500/30" /><PulseItem className="w-6 h-3 bg-emerald-500/30" /></div>
              <div className="flex justify-between"><PulseItem className="w-16 h-3 bg-emerald-500/30" /><PulseItem className="w-6 h-3 bg-emerald-500/30" /></div>
            </div>
          </div>

          {/* ID Card / Session Timer */}
          <div className="md:col-span-8 lg:col-span-6 rounded-3xl bg-teal-500/20 border border-teal-500/10 p-6 flex flex-col justify-between min-h-[300px]">
            <div className="flex justify-between">
              <div className="space-y-1"><PulseItem className="w-24 h-3 bg-teal-500/30" /><PulseItem className="w-32 h-4 bg-teal-500/30" /></div>
              <PulseItem className="w-6 h-6 rounded bg-teal-500/30" />
            </div>
            <div className="grid grid-cols-2 gap-4 my-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <PulseItem className="w-16 h-2 bg-teal-500/30" />
                  <PulseItem className="w-28 h-4 bg-teal-500/30" />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-teal-500/20">
              <div className="space-y-1"><PulseItem className="w-24 h-3 bg-teal-500/30" /><PulseItem className="w-20 h-5 bg-teal-500/30" /></div>
              <PulseItem className="w-32 h-10 rounded-xl bg-teal-500/30" />
            </div>
          </div>

          {/* Leaderboard Bento */}
          <div className="md:col-span-12 lg:col-span-3 rounded-3xl bg-orange-500/20 border border-orange-500/10 p-6 flex flex-col justify-between min-h-[300px]">
            <PulseItem className="w-10 h-10 rounded-xl bg-orange-500/30" />
            <div className="space-y-2"><PulseItem className="w-20 h-3 bg-orange-500/30" /><PulseItem className="w-28 h-6 bg-orange-500/30" /></div>
            <PulseItem className="w-full h-10 rounded-xl bg-orange-500/30" />
          </div>
        </div>

        {/* Row 2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
          {/* Performance Insights */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-indigo-500/20 border border-indigo-500/10 flex flex-col justify-between min-h-[340px]">
            <PulseItem className="w-32 h-4 bg-indigo-500/30" />
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="bg-indigo-500/10 p-4 rounded-2xl space-y-3">
                <PulseItem className="w-24 h-3 bg-indigo-500/30" />
                <PulseItem className="w-16 h-6 bg-indigo-500/30" />
                <PulseItem className="w-full h-1.5 rounded-full bg-indigo-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-indigo-500/10 p-4 rounded-2xl flex flex-col items-center space-y-2">
                  <PulseItem className="w-6 h-6 rounded-full bg-indigo-500/30" />
                  <PulseItem className="w-12 h-3 bg-indigo-500/30" />
                </div>
                <div className="bg-indigo-500/10 p-4 rounded-2xl flex flex-col items-center space-y-2">
                  <PulseItem className="w-6 h-6 rounded-full bg-indigo-500/30" />
                  <PulseItem className="w-12 h-3 bg-indigo-500/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Quizzes */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-purple-500/20 border border-purple-500/10 flex flex-col justify-between min-h-[340px]">
            <div className="flex items-center gap-3 mb-4">
              <PulseItem className="w-8 h-8 rounded-full bg-purple-500/30" />
              <div className="space-y-1"><PulseItem className="w-24 h-3 bg-purple-500/30" /><PulseItem className="w-36 h-2 bg-purple-500/30" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-purple-500/10 p-4 rounded-2xl flex justify-between items-center h-20">
                  <div className="space-y-2"><PulseItem className="w-28 h-3 bg-purple-500/30" /><PulseItem className="w-16 h-2.5 bg-purple-500/30" /></div>
                  <PulseItem className="w-14 h-8 rounded bg-purple-500/30" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="md:col-span-6 lg:col-span-4 p-6 rounded-3xl bg-slate-500/10 border border-slate-500/10 flex flex-col justify-between min-h-[250px]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <PulseItem className="w-8 h-8 rounded-full bg-slate-500/20" />
                  <PulseItem className="w-20 h-4 bg-slate-500/20" />
                </div>
                <PulseItem className="w-14 h-5 rounded-full bg-slate-500/20" />
              </div>
              <div className="space-y-3 flex-1 flex flex-col justify-center">
                <div className="bg-slate-500/5 p-3 rounded-xl flex justify-between items-center">
                  <PulseItem className="w-24 h-3 bg-slate-500/20" /><PulseItem className="w-10 h-3 bg-slate-500/20" />
                </div>
                <div className="bg-slate-500/5 p-3 rounded-xl flex justify-between items-center">
                  <PulseItem className="w-24 h-3 bg-slate-500/20" /><PulseItem className="w-10 h-3 bg-slate-500/20" />
                </div>
              </div>
              <PulseItem className="w-32 h-3 mx-auto mt-4 bg-slate-500/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Table Skeleton (Used for task management, attendance logs, enrollments, etc.)
  if (type === 'table') {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <PulseItem className="w-48 h-6" />
          <PulseItem className="w-32 h-10 rounded-xl" />
        </div>
        
        {/* Filter / Search Bar */}
        <div className="glass-panel p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <PulseItem className="w-full sm:w-64 h-10 rounded-xl" />
          <div className="flex gap-2 w-full sm:w-auto">
            <PulseItem className="w-28 h-10 rounded-xl" />
            <PulseItem className="w-28 h-10 rounded-xl" />
          </div>
        </div>

        {/* Table layout placeholder */}
        <div className="glass-panel overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
            <PulseItem className="w-12 h-4" />
            <PulseItem className="w-1/4 h-4" />
            <PulseItem className="w-1/6 h-4" />
            <PulseItem className="w-1/6 h-4" />
            <PulseItem className="w-1/6 h-4" />
            <PulseItem className="w-12 h-4 ml-auto" />
          </div>
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="border-b border-slate-100 dark:border-slate-800 p-5 flex items-center gap-4">
              <PulseItem className="w-8 h-8 rounded-full" />
              <div className="w-1/4 space-y-2">
                <PulseItem className="w-3/4 h-3.5" />
                <PulseItem className="w-1/2 h-2.5" />
              </div>
              <PulseItem className="w-1/6 h-3.5" />
              <PulseItem className="w-1/6 h-3.5" />
              <PulseItem className="w-1/6 h-5 rounded-full" />
              <PulseItem className="w-16 h-8 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Card Grid Skeleton (Used for student leetcode challenges, quizzes, available batches)
  if (type === 'card-grid') {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <PulseItem className="w-48 h-6" />
            <PulseItem className="w-32 h-3" />
          </div>
          <PulseItem className="w-28 h-10 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel p-6 flex flex-col justify-between h-[220px] space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <PulseItem className="w-32 h-4" />
                  <PulseItem className="w-16 h-5 rounded-full" />
                </div>
                <PulseItem className="w-full h-3" />
                <PulseItem className="w-5/6 h-3" />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <PulseItem className="w-5 h-5 rounded-full" />
                  <PulseItem className="w-16 h-2.5" />
                </div>
                <PulseItem className="w-24 h-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
