import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Button } from '../../components/ui';

export function AdminTimetablePage() {
  const queryClient = useQueryClient();
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
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to add slot')
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'timetable', selectedClass] });
    }
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  return (
    <div className="pt-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-extrabold text-on-surface">Timetable Manager</h2>
        <p className="text-on-surface-variant mt-2 max-w-2xl">Manage scheduling and automated session generation.</p>
      </div>

      <div className="flex gap-4 items-center">
         <span className="font-label text-sm uppercase tracking-widest font-bold text-on-surface-variant">Select Class:</span>
         <select 
             className="bg-surface border border-outline-variant rounded-xl px-4 py-2 font-body"
             value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
             <option value="">-- Choose Class --</option>
             {classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
      </div>

      {selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 h-fit">
                <h3 className="font-headline font-bold text-lg mb-6">Add New Slot</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Subject</label>
                        <select className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2" value={newSlot.subject_id} onChange={(e) => setNewSlot({...newSlot, subject_id: e.target.value})}>
                            <option value="">Select subject</option>
                            {subjects?.map((s:any) => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Teacher</label>
                        <select className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2" value={newSlot.teacher_id} onChange={(e) => setNewSlot({...newSlot, teacher_id: e.target.value})}>
                            <option value="">Select teacher</option>
                            {teachers?.map((t:any) => <option key={t.id} value={t.id}>{t.profile.full_name} ({t.employee_id})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Day</label>
                        <select className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 capitalize" value={newSlot.day_of_week} onChange={(e) => setNewSlot({...newSlot, day_of_week: e.target.value})}>
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Start Time</label>
                            <input type="time" className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2" value={newSlot.start_time} onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">End Time</label>
                            <input type="time" className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2" value={newSlot.end_time} onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})} />
                        </div>
                    </div>
                    <Button 
                        onClick={() => createMutation.mutate()} 
                        disabled={!newSlot.subject_id || !newSlot.teacher_id || createMutation.isPending} 
                        className="w-full mt-4" 
                        variant="primary"
                    >
                        Save Slot
                    </Button>
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                {isLoadingTt && <p>Loading timetable...</p>}
                
                {days.map(day => {
                    const daySlots = timetable?.filter((t:any) => t.day_of_week === day) || [];
                    if (daySlots.length === 0) return null;
                    
                    return (
                        <div key={day} className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30">
                            <h4 className="font-headline font-bold text-lg capitalize mb-4 text-primary">{day}</h4>
                            <div className="space-y-3">
                                {daySlots.map((slot:any) => (
                                    <div key={slot.id} className="flex items-center justify-between bg-surface border border-outline-variant/50 p-4 rounded-xl">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded-md font-bold">{slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}</span>
                                                <span className="font-headline font-bold text-on-surface">{slot.subject?.name}</span>
                                            </div>
                                            <p className="font-body text-sm text-on-surface-variant mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">person</span>
                                                {slot.teacher?.profile?.full_name}
                                            </p>
                                        </div>
                                        <button onClick={() => deleteMutation.mutate(slot.id)} className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-error/10">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {timetable?.length === 0 && !isLoadingTt && (
                    <div className="text-center p-12 bg-surface-container-low rounded-3xl border border-outline-variant/30 border-dashed">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-3 block">event_busy</span>
                        <p className="font-body text-on-surface-variant">No slots found for this class.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
