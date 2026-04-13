import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

export function AdminAttendancePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // 1. Fetch Sessions for Date
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['admin', 'attendance', 'sessions', selectedDate],
    queryFn: () => adminApi.getAttendanceSessions(undefined) // optionally filter by class
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
      // Realistically we also invalidate student/teacher stats, but we are inside admin.
    }
  });

  // Filter sessions locally or wait for query to return only requested date
  // Since we don't pass date to the frontend API wrapper yet, let's filter locally
  const displayedSessions = sessions?.filter((s:any) => s.date === selectedDate) || [];

  return (
    <div className="space-y-8 animate-in pb-32">
      {/* Carbon Style Header */}
      <div className="border-b border-outline-subtle pb-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
          Attendance Ledger
        </h2>
        <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-[0.2em] font-bold opacity-60">
          Investigate & manage session compliance
        </p>
      </div>

      <div className="flex items-center gap-0 bg-surface-low border border-outline-subtle">
         <div className="px-5 border-r border-outline-subtle h-12 flex items-center font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
           Filter Registration
         </div>
         <input 
             type="date"
             className="h-12 px-6 bg-transparent font-body text-sm outline-none transition-all placeholder:text-on-surface-variant/40 border-r border-outline-subtle"
             value={selectedDate} 
             onChange={(e) => {
                 setSelectedDate(e.target.value);
                 setSelectedSessionId(null);
             }}
         />
         <div className="px-6 text-[10px] font-bold text-primary/60 uppercase tracking-widest">
           Live Registry Feed
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-outline-subtle bg-white overflow-hidden">
          {/* Left: Sessions List (Carbon High-Density Sidepanel) */}
          <div className="border-r border-outline-subtle bg-surface-low h-[70vh] flex flex-col">
              <div className="p-4 border-b border-outline-subtle bg-white">
                <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface">Daily Sessions</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-outline-subtle">
                 {isLoadingSessions && <p className="p-8 text-center font-mono text-[10px] uppercase opacity-40">Syncing sessions...</p>}
                 {displayedSessions.map((s:any) => (
                    <div 
                       key={s.id} 
                       onClick={() => setSelectedSessionId(s.id)}
                       className={`p-5 cursor-pointer transition-all ${selectedSessionId === s.id ? 'bg-white border-l-4 border-primary' : 'hover:bg-surface-high border-l-4 border-transparent'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-label text-[10px] font-bold text-primary uppercase tracking-tighter">{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</span>
                           <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 border ${
                             s.status === 'submitted' ? 'border-secondary/20 text-secondary bg-secondary/5' : 
                             s.status === 'edited' ? 'border-error/20 text-error bg-error/5' : 'border-outline-subtle text-on-surface-variant'
                           }`}>{s.status}</span>
                        </div>
                        <p className="font-headline font-bold text-on-surface text-sm">{s.subject?.name}</p>
                        <p className="text-[11px] text-on-surface-variant mt-1 opacity-60 font-medium uppercase tracking-tight">{s.class?.name} &bull; {s.teacher?.profile?.full_name}</p>
                    </div>
                 ))}
                 {displayedSessions.length === 0 && !isLoadingSessions && (
                     <div className="text-center p-12 opacity-30">
                         <span className="material-symbols-outlined text-4xl mb-2">calendar_today</span>
                         <p className="font-label text-[10px] uppercase font-bold tracking-widest">No entries found</p>
                     </div>
                 )}
              </div>
          </div>

          {/* Right: Roster Override (Carbon DataTable) */}
          <div className="bg-white flex flex-col h-[70vh]">
              {selectedSessionId ? (
                 <>
                    <div className="p-4 border-b border-outline-subtle flex items-center justify-between">
                        <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface">Session Roster</h3>
                        {isLoadingLogs && <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-surface-low border-b border-outline-subtle sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Member Identifier</th>
                                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-center">Status</th>
                                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-right">Overrides</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-subtle">
                                {logs?.map((log:any) => {
                                   const isPresent = log.status === 'present';
                                   return (
                                       <tr key={log.id} className="hover:bg-surface-low transition-colors group">
                                           <td className="p-4">
                                               <p className="font-bold text-xs text-on-surface uppercase tracking-tight">{log.student.roll_number}</p>
                                               <p className="text-[11px] text-on-surface-variant font-medium">{log.student.profile.full_name}</p>
                                           </td>
                                           <td className="p-4 text-center">
                                               <span className={`inline-flex px-2 py-0.5 border text-[9px] uppercase tracking-widest font-bold ${isPresent ? 'border-secondary/20 text-secondary bg-secondary/5' : 'border-error/20 text-error bg-error/5'}`}>
                                                 {log.status}
                                               </span>
                                           </td>
                                           <td className="p-4 text-right">
                                              <button
                                                onClick={() => overrideMutation.mutate({ id: log.id, status: isPresent ? 'absent' : 'present'})}
                                                disabled={overrideMutation.isPending}
                                                className="opacity-0 group-hover:opacity-100 h-8 px-4 font-label text-[9px] font-bold uppercase tracking-[0.2em] border border-outline-subtle bg-white hover:bg-surface-high transition-all disabled:opacity-30"
                                              >
                                                Flip Status
                                              </button>
                                           </td>
                                       </tr>
                                   )
                                })}
                            </tbody>
                        </table>
                    </div>
                 </>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                      <span className="material-symbols-outlined text-6xl mb-4 font-light">grid_view</span>
                      <p className="font-label text-[10px] uppercase font-bold tracking-[0.2em]">Select node for inspection</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
