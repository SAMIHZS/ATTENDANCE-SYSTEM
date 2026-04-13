import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi } from '../../api/teacher';

// Note: Using the single-student "Focused Roll Call" card model as defined in Stitch PRD.

type LocalMark = {
  student_id: string;
  status: 'present' | 'absent';
};

export function TeacherRollCallPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [localMarks, setLocalMarks] = useState<Record<string, LocalMark>>({});
  const [markAll, setMarkAll] = useState(false);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['teacher', 'session', id],
    queryFn: () => teacherApi.getSessionDetails(id!),
    enabled: !!id,
  });

  // Sync server marks to local marks on load
  useEffect(() => {
    if (sessionData && Object.keys(localMarks).length === 0) {
      const initial: Record<string, LocalMark> = {};
      sessionData.attendance?.forEach((a: any) => {
        initial[a.student_id] = { student_id: a.student_id, status: a.status as any };
      });
      setLocalMarks(initial);
    }
  }, [sessionData]);

  const students = sessionData?.students ?? [];
  const session = sessionData?.session;

  const currentStudent = students[currentIndex];

  const markMutation = useMutation({
    mutationFn: (marks: { student_id: string; status: 'present' | 'absent' }[]) =>
      teacherApi.saveAttendanceMarks(id!, marks),
    onSuccess: () => {
      // Background sync succeeded — no need to interrupt user
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => teacherApi.submitSession(id!),
    onSuccess: () => {
      // Invalidate both session and schedule to reflect 'submitted' status immediately on dashboard
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
      queryClient.invalidateQueries({ queryKey: ['health'] });
      navigate('/teacher/history'); 
    },
  });

  const confirmSubmit = () => {
    if (window.confirm("Are you sure you want to submit? This will lock the attendance ledger for this session.")) {
        submitMutation.mutate();
    }
  };

  const handleMark = (status: 'present' | 'absent') => {
    if (!currentStudent) return;
    
    // Optimistic UI updates
    setLocalMarks((prev) => ({
      ...prev,
      [currentStudent.id]: { student_id: currentStudent.id, status },
    }));

    // Auto-advance
    if (currentIndex < students.length - 1) {
      setCurrentIndex((i) => i + 1);
    }

    // Sync to server in background
    markMutation.mutate([{ student_id: currentStudent.id, status }]);
  };

  const handleMarkAllToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setMarkAll(isChecked);
    
    if (isChecked) {
      const newMarks: Record<string, LocalMark> = {};
      const payload: { student_id: string; status: 'present' }[] = [];
      students.forEach((s: any) => {
        newMarks[s.id] = { student_id: s.id, status: 'present' };
        payload.push({ student_id: s.id, status: 'present' });
      });
      setLocalMarks(newMarks);
      markMutation.mutate(payload);
    } else {
      setLocalMarks({});
    }
  };

  const markedCount = Object.values(localMarks).filter(m => m.status === 'present').length;
  const overallPercentage = students.length > 0 ? Math.round((markedCount / students.length) * 100) : 0;
  
  // Is everything marked (at least present/absent)?
  const totalMarked = Object.keys(localMarks).length;
  const isReadyToSubmit = totalMarked >= students.length;

  if (isLoading || !session) {
    return (
      <div className="pt-24 px-6 flex justify-center mt-20">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-body text-on-surface pt-24 min-h-screen animate-in">
      <main className="px-4 pt-2 pb-32 max-w-lg mx-auto relative">
        {/* Contextual Header (Linear Style) */}
        <section className="mb-10 px-1">
          <div className="flex items-center gap-3 mb-6">
             <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-role bg-white/[0.05] border border-white/[0.08] text-on-surface active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
             </button>
             <div className="flex flex-col">
               <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase opacity-60">Session In Progress</span>
               <h2 className="font-headline text-lg font-signature text-on-surface leading-tight">
                {session.class?.name || 'Class'} <span className="mx-1 text-white/20">—</span> <span className="text-primary">{session.actual_subject?.name || 'Subject'}</span>
               </h2>
             </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-white/[0.02] border border-white/[0.05] rounded-role">
            <div className="flex flex-col">
              <span className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Completion</span>
              <span className="text-on-surface font-headline text-sm font-bold">
                {markedCount} / {students.length} <span className="text-[10px] text-on-surface-variant ml-1 font-medium opacity-50">Students</span>
              </span>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="font-label text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">MARK ALL PRESENT</span>
              <div className="relative inline-flex items-center">
                <input type="checkbox" className="sr-only peer" checked={markAll} onChange={handleMarkAllToggle} />
                <div className="w-9 h-5 bg-white/[0.05] border border-white/[0.1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white/40 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary/40 peer-checked:border-secondary/40 peer-checked:after:bg-secondary"></div>
              </div>
            </label>
          </div>
        </section>

        {currentStudent ? (
          <>
            {/* Focused Student Card (Linear Style: High-definition cards, soft focus) */}
            <div className="relative group/card">
              <div className="absolute inset-x-4 inset-y-0 -translate-y-2 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
              
              <section className="relative overflow-hidden bg-surface-elevated rounded-role border border-outline border-white/[0.03] p-8 shadow-2xl shadow-black/40">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>

                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-40 h-40 rounded-role overflow-hidden mb-6 bg-white/[0.02] border border-white/[0.08] flex justify-center items-center shadow-inner">
                    <span className="material-symbols-outlined text-white/5 text-6xl">person</span>
                  </div>
                  
                  <div className="inline-flex px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-md text-on-surface-variant font-label text-[10px] uppercase tracking-widest mb-3">
                    Roll: {currentStudent.roll_number || 'N/A'}
                  </div>

                  <h3 className="font-headline text-2xl font-signature text-on-surface mb-1">
                    {currentStudent.profile?.full_name || 'Unknown Student'}
                  </h3>
                  
                  {/* Status Indicator */}
                  <div className="h-6 flex items-center mt-2">
                    {localMarks[currentStudent.id] ? (
                      <div className={`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        localMarks[currentStudent.id].status === 'present' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                      }`}>
                         <span className={`w-1 h-1 rounded-full ${localMarks[currentStudent.id].status === 'present' ? 'bg-secondary' : 'bg-error'}`}></span>
                         {localMarks[currentStudent.id].status}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Awaiting Mark</span>
                    )}
                  </div>
                </div>
                
                {/* Session Progress Bar overlaying bottom */}
                <div className="mt-8 pt-8 border-t border-white/[0.05] flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-label text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Session Progress</span>
                      <span className="text-[10px] font-bold text-on-surface">{overallPercentage}%</span>
                    </div>
                    <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${overallPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Interaction Buttons (Linear Style: High-contrast actions) */}
            <section className="mt-8 grid grid-cols-2 gap-4">
              <button 
                disabled={session.status !== 'draft'}
                onClick={() => handleMark('absent')}
                className={`group h-20 flex flex-col items-center justify-center rounded-role transition-all active:scale-95 border ${
                  localMarks[currentStudent.id]?.status === 'absent' 
                    ? 'bg-error text-white border-error shadow-lg shadow-error/20' 
                    : 'bg-white/[0.02] border-white/[0.05] text-on-surface-variant hover:border-error/40 hover:text-error hover:bg-error/5'
                } ${session.status !== 'draft' ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
                <span className="font-label text-[10px] font-black uppercase tracking-widest mt-1.5">Absent</span>
              </button>

              <button 
                disabled={session.status !== 'draft'}
                onClick={() => handleMark('present')}
                className={`group h-20 flex flex-col items-center justify-center rounded-role transition-all active:scale-95 border ${
                  localMarks[currentStudent.id]?.status === 'present' 
                    ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20' 
                    : 'bg-white/[0.02] border-white/[0.05] text-on-surface-variant hover:border-secondary/40 hover:text-secondary hover:bg-secondary/5'
                } ${session.status !== 'draft' ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-[24px]">check</span>
                <span className="font-label text-[10px] font-black uppercase tracking-widest mt-1.5">Present</span>
              </button>
            </section>
          </>
        ) : (
            <div className="text-center py-20">No students available for this class</div>
        )}

        {/* Horizontal Scroll Bar Navigation */}
        {/* Horizontal Quick Jump (Linear Style) */}
        {students.length > 0 && (
            <section className="mt-12 mb-8">
              <div className="flex items-center justify-between px-1 mb-4">
                  <h4 className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Quick Jump</h4>
                  <span className="text-[10px] font-bold text-on-surface-variant">{currentIndex + 1} / {students.length}</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-4 px-1 snap-x no-scrollbar">
                  {students.map((s: any, idx: number) => {
                      const isCurrent = idx === currentIndex;
                      const hasStatus = localMarks[s.id];
                      let dotColor = 'bg-white/10';
                      let borderColor = 'border-white/[0.05]';
                      let textColor = 'text-on-surface-variant';
                      
                      if (isCurrent) {
                        borderColor = 'border-primary';
                        textColor = 'text-on-surface';
                      }

                      if (hasStatus) {
                        dotColor = hasStatus.status === 'present' ? 'bg-secondary' : 'bg-error';
                      }

                      return (
                          <button 
                              key={s.id} 
                              onClick={() => setCurrentIndex(idx)}
                              className={`snap-center flex-none w-10 h-10 flex flex-col items-center justify-center rounded-role border transition-all ${borderColor} ${textColor} ${!isCurrent ? 'bg-white/[0.02] hover:bg-white/[0.05]' : 'bg-primary/5'}`}
                          >
                              <span className="font-headline text-xs font-bold leading-none">{idx + 1}</span>
                              <div className={`w-1 h-1 rounded-full mt-1.5 ${dotColor}`}></div>
                          </button>
                      )
                  })}
              </div>
            </section>
        )}

        {/* Dynamic Submit Button (Linear Style) */}
        <div className="fixed bottom-28 left-0 w-full px-6 z-40 bg-gradient-to-t from-background via-background/80 to-transparent pb-6 pt-12">
          {session.status === 'submitted' || session.status === 'edited' ? (
              <div className="w-full max-w-lg mx-auto h-12 bg-white/[0.03] border border-white/[0.08] text-on-surface-variant/40 font-headline font-bold flex items-center justify-center gap-3 rounded-role">
                 <span className="material-symbols-outlined text-[18px]">lock</span>
                 <span className="text-sm uppercase tracking-widest">Marking Closed</span>
              </div>
          ) : (
            <button 
                disabled={!isReadyToSubmit || submitMutation.isPending}
                onClick={confirmSubmit}
                className={`w-full max-w-lg mx-auto h-12 rounded-role font-headline font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/40 ${isReadyToSubmit ? 'bg-primary hover:bg-primary-hover text-white opacity-100 active:scale-[0.98]' : 'bg-white/[0.05] border border-white/[0.05] text-on-surface-variant opacity-40 cursor-not-allowed'}`}
            >
                {submitMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                ) : (
                    <>
                        <span className="text-sm uppercase tracking-widest leading-none">Complete Session</span>
                        <span className="material-symbols-outlined text-[18px]">done_all</span>
                    </>
                )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
