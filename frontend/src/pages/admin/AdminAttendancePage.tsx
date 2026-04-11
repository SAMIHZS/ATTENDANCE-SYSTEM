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
    <div className="pt-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-extrabold text-on-surface">Attendance Explorer</h2>
        <p className="text-on-surface-variant mt-2 max-w-2xl">Investigate specific sessions and correct attendance records.</p>
      </div>

      <div className="flex gap-4 items-center">
         <span className="font-label text-sm uppercase tracking-widest font-bold text-on-surface-variant">Select Date:</span>
         <input 
             type="date"
             className="bg-surface border border-outline-variant rounded-xl px-4 py-2 font-body"
             value={selectedDate} 
             onChange={(e) => {
                 setSelectedDate(e.target.value);
                 setSelectedSessionId(null);
             }}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Sessions List */}
          <div className="bg-surface-container-low rounded-3xl p-6 shadow-sm border border-outline-variant/30 h-fit">
              <h3 className="font-headline font-bold text-lg mb-6">Sessions on {selectedDate}</h3>
              {isLoadingSessions && <p className="text-on-surface-variant text-sm">Loading sessions...</p>}
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                 {displayedSessions.map((s:any) => (
                    <div 
                       key={s.id} 
                       onClick={() => setSelectedSessionId(s.id)}
                       className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedSessionId === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-outline-variant/50 bg-surface hover:border-primary/50'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                           <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</span>
                           <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                             s.status === 'submitted' ? 'bg-secondary/10 text-secondary' : 
                             s.status === 'edited' ? 'bg-error/10 text-error' : 'bg-surface-variant text-on-surface-variant'
                           }`}>{s.status}</span>
                        </div>
                        <p className="font-headline font-bold text-on-surface text-base">{s.subject?.name}</p>
                        <p className="font-body text-xs text-on-surface-variant mt-1">{s.class?.name} • {s.teacher?.profile?.full_name}</p>
                    </div>
                 ))}
                 {displayedSessions.length === 0 && !isLoadingSessions && (
                     <div className="text-center p-8 bg-surface border border-dashed border-outline-variant/50 rounded-xl">
                         <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">event_busy</span>
                         <p className="font-body text-on-surface-variant text-sm">No scheduled sessions for this day.</p>
                     </div>
                 )}
              </div>
          </div>

          {/* Right: Roster Override */}
          <div className="bg-surface-container-low rounded-3xl p-6 shadow-sm border border-outline-variant/30 h-fit">
              {selectedSessionId ? (
                 <>
                    <h3 className="font-headline font-bold text-lg mb-6 flex items-center justify-between">
                        Session Roster
                        {isLoadingLogs && <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>}
                    </h3>

                    <div className="bg-surface rounded-2xl overflow-hidden border border-outline-variant/30">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-container border-b border-outline-variant/30">
                                <tr>
                                    <th className="p-3 font-label text-xs uppercase text-on-surface-variant">Student</th>
                                    <th className="p-3 font-label text-xs uppercase text-on-surface-variant text-center">Current</th>
                                    <th className="p-3 font-label text-xs uppercase text-on-surface-variant text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {logs?.map((log:any) => {
                                   const isPresent = log.status === 'present';
                                   return (
                                       <tr key={log.id} className="hover:bg-surface-variant/30">
                                           <td className="p-3">
                                               <p className="font-bold text-on-surface">{log.student.roll_number}</p>
                                               <p className="text-xs text-on-surface-variant">{log.student.profile.full_name}</p>
                                           </td>
                                           <td className="p-3 text-center">
                                               <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold ${isPresent ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                                                 {log.status}
                                               </span>
                                           </td>
                                           <td className="p-3 text-right">
                                              <button
                                                onClick={() => overrideMutation.mutate({ id: log.id, status: isPresent ? 'absent' : 'present'})}
                                                disabled={overrideMutation.isPending}
                                                className="text-xs font-bold text-primary hover:text-primary/70 transition-colors disabled:opacity-50"
                                              >
                                                Mark {isPresent ? 'Absent' : 'Present'}
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
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-on-surface-variant opacity-70">
                      <span className="material-symbols-outlined text-6xl mb-4">fact_check</span>
                      <p className="font-body">Select a session from the list to view and manage its attendance roster.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
