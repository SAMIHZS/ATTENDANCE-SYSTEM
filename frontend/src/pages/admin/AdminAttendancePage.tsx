import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';

export function AdminAttendancePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const debouncedRosterSearch = useDebounce(rosterSearch, 400);

  // 1. Fetch Sessions for Date (Optimized: Server-side filtering)
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['admin', 'attendance', 'sessions', selectedDate],
    queryFn: () => adminApi.getAttendanceSessions(undefined, selectedDate)
  });

  // 2. Fetch Logs for specific Session
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['admin', 'attendance', 'session-logs', selectedSessionId],
    queryFn: () => adminApi.getAttendanceSessionLogs(selectedSessionId!),
    enabled: !!selectedSessionId
  });

  // 3. Override Mutation
  const overrideMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'present' | 'absent' }) => 
      adminApi.overrideAttendance(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'session-logs', selectedSessionId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance', 'sessions', selectedDate] });
      showToast('Attendance record corrected', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to override attendance', 'error')
  });

  // Filter roster locally based on debounced search
  const filteredLogs = logs?.filter((log: any) => 
    log.student.roll_number.toLowerCase().includes(debouncedRosterSearch.toLowerCase()) ||
    log.student.profile.full_name.toLowerCase().includes(debouncedRosterSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in pb-32">
      {/* Carbon Style Header */}
      <div className="border-b border-outline-subtle pb-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
          Attendance Ledger
        </h2>
        <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-[0.2em] font-bold opacity-60">
          Orchestrate session compliance and audit roster integrity
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-0 bg-surface-low border border-outline-subtle">
         <div className="px-5 border-r border-outline-subtle h-11 flex items-center font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
           Observation Date
         </div>
         <div className="relative border-r border-outline-subtle">
           <input 
               type="date"
               className="h-11 px-6 bg-white font-mono text-xs font-bold uppercase outline-none transition-all appearance-none cursor-pointer"
               value={selectedDate} 
               onChange={(e) => {
                   setSelectedDate(e.target.value);
                   setSelectedSessionId(null);
               }}
           />
         </div>
         <div className="flex-1 px-6 text-[10px] font-bold text-primary/60 uppercase tracking-[0.3em] font-mono">
           {isLoadingSessions ? 'Syncing...' : `Registry count: ${sessions?.length || 0}`}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-outline-subtle bg-white overflow-hidden max-h-[75vh]">
          {/* Left: Sessions List (Carbon High-Density Sidepanel) */}
          <div className="lg:col-span-2 border-r border-outline-subtle bg-surface-low flex flex-col overflow-hidden">
              <div className="p-4 border-b border-outline-subtle bg-white flex items-center justify-between">
                <h3 className="font-label text-xs font-bold uppercase tracking-[0.1em] text-on-surface">Temporal Sessions</h3>
                <span className="text-[9px] font-mono opacity-40 uppercase tracking-tighter">Sorted by Time</span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-outline-subtle custom-scrollbar">
                 {isLoadingSessions && (
                   <div className="p-12 text-center">
                     <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin inline-block mb-3" />
                     <p className="font-mono text-[10px] uppercase opacity-40">Polling session feed...</p>
                   </div>
                 )}
                 {sessions?.map((s:any) => (
                    <div 
                       key={s.id} 
                       onClick={() => setSelectedSessionId(s.id)}
                       className={`p-5 cursor-pointer transition-all border-l-4 ${selectedSessionId === s.id ? 'bg-white border-primary' : 'hover:bg-surface-high border-transparent'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-tighter">{s.start_time.substring(0,5)} &mdash; {s.end_time.substring(0,5)}</span>
                           <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 border ${
                             s.status === 'submitted' ? 'border-secondary/20 text-secondary bg-secondary/5' : 
                             s.status === 'edited' ? 'border-primary/20 text-primary bg-primary/5' : 'border-outline-subtle text-on-surface-variant'
                           }`}>{s.status}</span>
                        </div>
                        <p className="font-headline font-bold text-on-surface text-sm uppercase tracking-tight">{s.subject?.name}</p>
                        <p className="text-[10px] text-on-surface-variant/70 mt-1 font-bold uppercase tracking-[0.05em] flex items-center gap-2">
                          <span className="bg-surface-high px-1.5 py-0.5 border border-outline-subtle">{s.class?.name}</span>
                          <span className="opacity-50 font-medium">Faculty:</span>
                          <span>{s.teacher?.profile?.full_name}</span>
                        </p>
                    </div>
                 ))}
                 {sessions?.length === 0 && !isLoadingSessions && (
                     <div className="text-center p-20 opacity-20 filter grayscale">
                         <span className="material-symbols-outlined text-5xl mb-4 font-light">history_edu</span>
                         <p className="font-label text-[10px] uppercase font-bold tracking-[0.4em]">Zero Activity Logs</p>
                     </div>
                 )}
              </div>
          </div>

          {/* Right: Roster Override (Carbon Data Table) */}
          <div className="lg:col-span-3 bg-white flex flex-col overflow-hidden h-full">
              {selectedSessionId ? (
                 <>
                    <div className="p-0 border-b border-outline-subtle flex flex-col">
                        <div className="p-4 flex items-center justify-between bg-surface-low border-b border-outline-subtle">
                            <h3 className="font-label text-xs font-bold uppercase tracking-[0.1em] text-on-surface">Member Roster Audit</h3>
                            <div className="flex items-center gap-4">
                              {isLoadingLogs && <span className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></span>}
                              <span className="text-[10px] font-mono text-on-surface-variant font-bold opacity-60 uppercase">{filteredLogs?.length} Records Matching</span>
                            </div>
                        </div>
                        {/* Inline Roster Search */}
                        <div className="px-4 h-10 flex items-center gap-3 bg-white">
                           <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">filter_list</span>
                           <input 
                              type="text" 
                              placeholder="Quick search roster (Name, Roll)..."
                              className="flex-1 bg-transparent text-xs font-headline font-medium outline-none placeholder:text-on-surface-variant/30"
                              value={rosterSearch}
                              onChange={(e) => setRosterSearch(e.target.value)}
                           />
                           {rosterSearch && (
                             <button onClick={() => setRosterSearch('')} className="text-on-surface-variant/40 hover:text-on-surface">
                               <span className="material-symbols-outlined text-lg">close</span>
                             </button>
                           )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar shadow-inner">
                        <table className="w-full text-left bg-white">
                            <thead className="bg-surface-low sticky top-0 z-20 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface border-b border-outline-subtle">Roll Number</th>
                                    <th className="px-6 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface border-b border-outline-subtle text-center">Engagement</th>
                                    <th className="px-6 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface text-right border-b border-outline-subtle">Audit Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-subtle/50">
                                {filteredLogs?.map((log:any) => {
                                   const isPresent = log.status === 'present';
                                   const isCurrentlyUpdating = overrideMutation.isPending && overrideMutation.variables?.id === log.id;

                                   return (
                                       <tr key={log.id} className={`hover:bg-surface-low transition-colors group ${isCurrentlyUpdating ? 'opacity-40 animate-pulse' : ''}`}>
                                           <td className="px-6 py-4">
                                               <p className="font-mono text-[11px] font-bold text-on-surface tracking-tighter">{log.student.roll_number}</p>
                                               <p className="text-[10px] text-on-surface-variant font-bold uppercase opacity-60 mt-0.5">{log.student.profile.full_name}</p>
                                           </td>
                                           <td className="px-6 py-4 text-center">
                                               <span className={`inline-flex px-2 py-0.5 border text-[9px] uppercase tracking-widest font-bold ${
                                                 isPresent ? 'border-secondary/20 text-secondary bg-secondary/5' : 'border-error/20 text-error bg-error/5'
                                               }`}>
                                                 {log.status}
                                               </span>
                                           </td>
                                           <td className="px-6 py-4 text-right">
                                              <button
                                                onClick={() => overrideMutation.mutate({ id: log.id, status: isPresent ? 'absent' : 'present'})}
                                                disabled={overrideMutation.isPending}
                                                className={`h-8 px-5 font-label text-[9px] font-bold uppercase tracking-[0.1em] border transition-all ${
                                                  isPresent 
                                                    ? 'border-error/20 text-error hover:bg-error hover:text-white' 
                                                    : 'border-secondary/20 text-secondary hover:bg-secondary hover:text-white'
                                                } disabled:opacity-30 opacity-0 group-hover:opacity-100`}
                                              >
                                                {isCurrentlyUpdating ? 'Syncing...' : `Mark ${isPresent ? 'Absent' : 'Present'}`}
                                              </button>
                                           </td>
                                       </tr>
                                   )
                                })}
                            </tbody>
                        </table>
                        {filteredLogs?.length === 0 && !isLoadingLogs && (
                          <div className="p-16 text-center text-on-surface-variant opacity-30 select-none">
                            <span className="material-symbols-outlined text-4xl mb-3 block">search_off</span>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em]">No students found matching your criteria</p>
                          </div>
                        )}
                    </div>
                 </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-10 select-none filter grayscale">
                      <span className="material-symbols-outlined text-[80px] mb-6 font-thin">receipt_long</span>
                      <p className="font-label text-[11px] uppercase font-bold tracking-[0.5em]">Inventory Selection Required</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
