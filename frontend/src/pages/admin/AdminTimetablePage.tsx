import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';

export function AdminTimetablePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const { data: classes } = useQuery({ queryKey: ['admin', 'classes'], queryFn: adminApi.getClasses });
  const { data: subjects } = useQuery({ queryKey: ['admin', 'subjects'], queryFn: adminApi.getSubjects });
  const { data: teachers } = useQuery({ queryKey: ['admin', 'teachers'], queryFn: () => adminApi.getTeachers() });
  
  const { data: timetable, isLoading: isLoadingTt } = useQuery({
    queryKey: ['admin', 'timetable', selectedClass],
    queryFn: () => adminApi.getTimetables(selectedClass),
    enabled: !!selectedClass
  });

  const [newSlot, setNewSlot] = useState({
      subject_id: '',
      teacher_id: '',
      day_of_week: 'monday',
      start_time: '09:00',
      end_time: '10:00'
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createTimetable({ class_id: selectedClass, ...newSlot }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'timetable', selectedClass] });
      setNewSlot({ ...newSlot, start_time: newSlot.end_time }); // fast sequential add
      showToast('Temporal slot provisioned', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to add slot', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'timetable', selectedClass] });
      showToast('Temporal slot removed', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to remove slot', 'error')
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  return (
    <div className="space-y-8 animate-in pb-32">
      {/* Header (IBM Carbon Style) */}
      <div className="border-b border-outline-subtle pb-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">Timetable Manager</h2>
        <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-[0.2em] font-bold opacity-60">
          Orchestrate session schedules and automated generation logic
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-0 bg-surface-low border border-outline-subtle">
         <div className="flex items-center px-4 h-11 border-r border-outline-subtle bg-white">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-lg mr-2">group</span>
            <select 
                className="bg-transparent font-body text-xs font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer pr-4"
                value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">-- Choose Target Batch --</option>
                {classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
         </div>
         {selectedClass && (
           <div className="flex-1 px-4 h-11 flex items-center">
              <span className="font-mono text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 border border-primary/20">
                Registry ID: {selectedClass.substring(0,8)}...
              </span>
           </div>
         )}
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Creation Panel */}
            <div className="lg:col-span-1 bg-white border border-outline-subtle p-0 overflow-hidden">
                <div className="bg-surface-low p-4 border-b border-outline-subtle">
                    <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface">Slot Provisioning</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2">Subject Resource</label>
                        <select className="w-full bg-surface-low border border-outline-subtle rounded-none px-3 h-10 text-sm font-headline font-bold" value={newSlot.subject_id} onChange={(e) => setNewSlot({...newSlot, subject_id: e.target.value})}>
                            <option value="">Select subject</option>
                            {subjects?.map((s:any) => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2">Primary Faculty</label>
                        <select className="w-full bg-surface-low border border-outline-subtle rounded-none px-3 h-10 text-sm font-headline font-bold" value={newSlot.teacher_id} onChange={(e) => setNewSlot({...newSlot, teacher_id: e.target.value})}>
                            <option value="">Select teacher</option>
                            {teachers?.map((t:any) => <option key={t.id} value={t.id}>{t.profile.full_name} ({t.employee_id})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2">Temporal Day</label>
                        <select className="w-full bg-surface-low border border-outline-subtle rounded-none px-3 h-10 text-sm font-headline font-bold uppercase tracking-widest" value={newSlot.day_of_week} onChange={(e) => setNewSlot({...newSlot, day_of_week: e.target.value})}>
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2">Start T.</label>
                            <input type="time" className="w-full bg-surface-low border border-outline-subtle rounded-none px-3 h-10 text-sm font-mono" value={newSlot.start_time} onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant mb-2">End T.</label>
                            <input type="time" className="w-full bg-surface-low border border-outline-subtle rounded-none px-3 h-10 text-sm font-mono" value={newSlot.end_time} onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})} />
                        </div>
                    </div>
                    <button 
                        onClick={() => createMutation.mutate()} 
                        disabled={!newSlot.subject_id || !newSlot.teacher_id || createMutation.isPending}
                        className="w-full h-12 bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                    >
                        <span>{createMutation.isPending ? 'Provisioning...' : 'Provision Slot'}</span>
                        <span className={`material-symbols-outlined text-lg ${createMutation.isPending ? 'animate-spin' : ''}`}>
                          {createMutation.isPending ? 'sync' : 'add'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Display Panel */}
            <div className="lg:col-span-2 space-y-6">
                {isLoadingTt && (
                  <div className="p-12 text-center text-on-surface-variant font-mono text-xs uppercase tracking-tighter opacity-50 border border-outline-subtle border-dashed">
                      Syncing timetable registry...
                  </div>
                )}
                
                {days.map(day => {
                    const daySlots = timetable?.filter((t:any) => t.day_of_week === day) || [];
                    if (daySlots.length === 0) return null;
                    
                    return (
                        <div key={day} className="bg-white border border-outline-subtle overflow-hidden">
                            <div className="bg-surface-low px-4 py-2 border-b border-outline-subtle flex items-center justify-between">
                                <h4 className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{day}</h4>
                                <span className="text-[9px] font-mono text-on-surface-variant opacity-40 uppercase">{daySlots.length} Slots defined</span>
                            </div>
                            <div className="divide-y divide-outline-subtle">
                                {daySlots.map((slot:any) => (
                                    <div key={slot.id} className={`flex items-center justify-between p-4 hover:bg-surface-low transition-colors group ${deleteMutation.isPending && deleteMutation.variables === slot.id ? 'opacity-30' : ''}`}>
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-xs font-bold text-primary">{slot.start_time.substring(0,5)}</span>
                                                <span className="font-mono text-[9px] text-on-surface-variant opacity-50">{slot.end_time.substring(0,5)}</span>
                                            </div>
                                            <div>
                                                <span className="font-headline font-bold text-sm text-on-surface uppercase tracking-tight block">{slot.subject?.name}</span>
                                                <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 flex items-center gap-1.5 opacity-60">
                                                    <span className="material-symbols-outlined text-[14px]">account_box</span>
                                                    {slot.teacher?.profile?.full_name}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                          onClick={() => { if(confirm('Remove this slot?')) deleteMutation.mutate(slot.id)}} 
                                          disabled={deleteMutation.isPending}
                                          className="text-on-surface-variant hover:text-error transition-colors h-9 w-9 flex items-center justify-center hover:bg-error/5 opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                              {deleteMutation.isPending && deleteMutation.variables === slot.id ? 'sync' : 'delete'}
                                            </span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {timetable?.length === 0 && !isLoadingTt && (
                    <div className="text-center p-16 bg-white border border-outline-subtle border-dashed grayscale">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">event_busy</span>
                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">Empty Schedule Registry</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
