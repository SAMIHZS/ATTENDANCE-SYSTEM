import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, type AdminReportData } from '../../api/admin';

export function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    from: '',
    to: ''
  });
  const limit = 100;

  // Fetch available classes for filtering
  const { data: classes } = useQuery<any[]>({
    queryKey: ['admin', 'classes'],
    queryFn: adminApi.getClasses,
  });

  const { data, isLoading } = useQuery<AdminReportData>({
    queryKey: ['admin', 'reports', page, filters],
    queryFn: () => adminApi.getReports({ 
      page, 
      limit, 
      classId: filters.classId || undefined,
    }),
    staleTime: 60 * 1000 * 2,
  });

  const handleExportClass = () => {
    if (!filters.classId) {
      alert('Please select a class first');
      return;
    }
    adminApi.exportClassReport(filters as { classId: string });
  };

  const handleExportSubject = () => {
    if (!filters.classId || !filters.subjectId) {
      alert('Please select both a class and a subject');
      return;
    }
    adminApi.exportSubjectReport(filters as { classId: string; subjectId: string });
  };

  const handleExportSessions = () => {
    if (!filters.classId) {
      alert('Please select a class first');
      return;
    }
    adminApi.exportSessionsReport(filters as { classId: string });
  };

  if (isLoading) {
    return (
      <div className="pt-24 px-6 flex justify-center">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const students = data?.students || [];
  const subjectsMap = data?.subjectsMap || {};
  const meta = data?.meta;
  const subjectIds = Object.keys(subjectsMap);

  return (
    <div className="pt-24 px-6 max-w-[1400px] mx-auto pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-2xl text-primary tracking-tight">
            Admin Reports & Exports
          </h2>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Generate and download attendance data for institutional records.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-end gap-3 bg-surface-container-low p-4 rounded-3xl border border-outline-variant">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-2">Class</label>
            <select 
              value={filters.classId}
              onChange={(e) => { setFilters(f => ({ ...f, classId: e.target.value })); setPage(1); }}
              className="bg-surface-container-highest px-4 py-2 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-primary shadow-sm min-w-[160px]"
            >
              <option value="">Select Class</option>
              {classes?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-2">Subject</label>
            <select 
              value={filters.subjectId}
              onChange={(e) => setFilters(f => ({ ...f, subjectId: e.target.value }))}
              className="bg-surface-container-highest px-4 py-2 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-primary shadow-sm min-w-[160px]"
            >
              <option value="">All Subjects</option>
              {subjectIds.map(sid => <option key={sid} value={sid}>{subjectsMap[sid]}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-2">From</label>
            <input 
              type="date"
              value={filters.from}
              onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))}
              className="bg-surface-container-highest px-4 py-2 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ml-2">To</label>
            <input 
              type="date"
              value={filters.to}
              onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))}
              className="bg-surface-container-highest px-4 py-2 rounded-2xl text-sm font-medium border-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="flex gap-2 ml-2">
            <button 
              onClick={handleExportClass}
              title="Full Class Spreadsheet"
              className="bg-primary text-on-primary px-4 py-2 rounded-2xl font-label text-xs uppercase tracking-widest font-bold flex items-center gap-1 hover:brightness-110 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">grid_on</span>
              Class
            </button>
            <button 
              onClick={handleExportSubject}
              disabled={!filters.subjectId}
              title={filters.subjectId ? "Export current subject" : "Select a subject to export"}
              className="bg-primary/20 text-primary px-4 py-2 rounded-2xl font-label text-xs uppercase tracking-widest font-bold flex items-center gap-1 hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-primary/30"
            >
              <span className="material-symbols-outlined text-sm">filter_alt</span>
              Subject
            </button>
            <button 
              onClick={handleExportSessions}
              title="Daily Attendance Logs"
              className="bg-secondary text-on-secondary px-4 py-2 rounded-2xl font-label text-xs uppercase tracking-widest font-bold flex items-center gap-1 hover:brightness-110 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              Logs
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="p-4 font-label text-xs uppercase text-on-surface-variant tracking-widest border-r border-outline-variant/50 sticky left-0 z-10 bg-surface-container-low">
                Regd No.
              </th>
              {subjectIds.map(sid => (
                <th key={sid} className="p-4 font-label text-xs uppercase text-on-surface-variant tracking-widest text-center border-r border-outline-variant/50">
                  {subjectsMap[sid]}
                </th>
              ))}
              <th className="p-4 font-label text-xs uppercase text-on-surface-variant tracking-widest text-center border-r border-outline-variant/50 bg-secondary/5 text-secondary">
                Total
              </th>
              <th className="p-4 font-label text-xs uppercase text-on-surface-variant tracking-widest text-center bg-primary/5 text-primary">
                %
              </th>
            </tr>
          </thead>
          <tbody className="font-body text-sm divide-y divide-outline-variant/50">
            {students.map((student) => {
              // Aggregate subject classes
              const subjCounts: Record<string, { total: number; attended: number }> = {};
              subjectIds.forEach(id => subjCounts[id] = { total: 0, attended: 0 });

              let grandTotal = 0;
              let grandAttended = 0;

              student.attendance?.forEach((att: any) => {
                const sId = att.sessions.actual_subject_id;
                if (subjCounts[sId]) {
                  const aggregated = att.count_data;
                  if (aggregated) {
                    subjCounts[sId].total += aggregated.total;
                    subjCounts[sId].attended += aggregated.attended;
                    grandTotal += aggregated.total;
                    grandAttended += aggregated.attended;
                  }
                }
              });

              const overallPercent = grandTotal === 0 ? 0 : Math.round((grandAttended / grandTotal) * 100);
              const isDanger = overallPercent < 75;

              return (
                <tr key={student.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="p-4 font-medium border-r border-outline-variant/50 sticky left-0 z-10 bg-surface-container-lowest">
                    {student.roll_number}
                  </td>
                  {subjectIds.map(sid => {
                    const c = subjCounts[sid];
                    return (
                      <td key={sid} className="p-4 text-center border-r border-outline-variant/50 text-on-surface-variant group relative">
                         {c.total > 0 ? `${c.attended} / ${c.total}` : '-'}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center font-bold border-r border-outline-variant/50 bg-secondary/5 text-secondary">
                    {grandAttended} / {grandTotal}
                  </td>
                  <td className={`p-4 text-center font-bold ${isDanger ? 'bg-error/10 text-error' : 'bg-primary/5 text-primary'}`}>
                    {overallPercent}%
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
               <tr>
                 <td colSpan={subjectIds.length + 3} className="p-8 text-center text-on-surface-variant">No records available</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {meta && meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between px-2">
           <div className="text-sm text-on-surface-variant">
              Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong>
           </div>
           <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container text-on-surface active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button 
                disabled={page >= meta.totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container text-on-surface active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
