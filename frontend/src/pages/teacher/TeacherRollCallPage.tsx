import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherApi } from '../../api/teacher';

// Note: Using the single-student "Focused Roll Call" card model as defined in Stitch PRD.

type LocalMark = {
  student_id: string;
  status: 'present' | 'absent' | 'other';
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

  const handleMark = (status: 'present' | 'absent' | 'other') => {
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

    // Sync to server in background for just this one mark (or we could debounce)
    if (status !== 'other') { // Only support present/absent on backend right now
      markMutation.mutate([{ student_id: currentStudent.id, status }]);
    }
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
    <div className="bg-surface font-body text-on-surface overflow-x-hidden pt-24 min-h-screen">
      <main className="px-6 pt-2 pb-32 max-w-md mx-auto relative">
        {/* Contextual Header */}
        <section className="mb-8 pl-2">
          <div className="flex items-center gap-2 mb-4">
             <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant active:scale-90 transition-all">
                <span className="material-symbols-outlined text-lg font-bold">arrow_back</span>
             </button>
             <span className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase">Course Details</span>
          </div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">
                Current Session
              </p>
              <h2 className="font-headline text-3xl font-extrabold tracking-tight text-primary mt-1">
                {session.class?.name || 'Class'}
              </h2>
              <p className="font-body text-secondary font-medium italic">
                {session.actual_subject?.name || 'Subject'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="font-label text-[10px] font-bold text-on-surface-variant">MARK ALL PRESENT</span>
                <div className="relative inline-flex items-center">
                  <input type="checkbox" className="sr-only peer" checked={markAll} onChange={handleMarkAllToggle} />
                  <div className="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </div>
              </label>
            </div>
          </div>
        </section>

        {currentStudent ? (
          <>
            {/* Focused Student Card */}
            <div className="relative">
              {/* Background Decoration Layer for depth */}
              <div className="absolute inset-0 translate-y-4 translate-x-2 bg-primary-container/5 rounded-[2rem] -z-10"></div>
              
              <section className="bg-surface-container-lowest rounded-[2rem] p-8 transition-all active:scale-[0.98] duration-300 editorial-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-48 h-48 rounded-[1.5rem] overflow-hidden mb-6 bg-surface-container-high ring-8 ring-surface-container-low flex justify-center items-center">
                    {/* Placeholder image from UI, ideally student.avatar_url */}
                    <span className="material-symbols-outlined text-border/20 text-6xl">person</span>
                  </div>
                  <span className="font-label text-[11px] font-bold tracking-widest text-secondary-container bg-primary-container px-3 py-1 rounded-full mb-3 uppercase">
                    Roll Number
                  </span>
                  <h3 className="font-headline text-2xl font-bold text-primary mb-1">
                    {currentStudent.first_name} {currentStudent.last_name}
                  </h3>
                  <p className="font-body text-on-surface-variant tracking-wider font-medium">
                    {currentStudent.roll_number || 'N/A'}
                  </p>
                </div>
                
                {/* Visual indicator of what is currently logged for this student locally */}
                {localMarks[currentStudent.id] && (
                     <div className={`mt-4 text-center font-bold text-sm uppercase ${localMarks[currentStudent.id].status === 'present' ? 'text-secondary' : 'text-error'}`}>
                         Marked: {localMarks[currentStudent.id].status}
                     </div>
                )}
                
                {/* Tonal Progress Indicator */}
                <div className="mt-8 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-label text-[10px] text-on-surface-variant font-bold uppercase">Overall Attendance</span>
                    <span className="font-headline text-lg font-bold text-primary">
                      {overallPercentage}% <span className="text-xs font-normal text-on-surface-variant tracking-normal">Session</span>
                    </span>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary-container/20">
                    <span className="material-symbols-outlined text-secondary">insights</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Interaction Buttons */}
            <section className="mt-12 grid grid-cols-3 gap-4">
              <button 
                disabled={session.status !== 'draft'}
                onClick={() => handleMark('absent')}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all active:scale-90 border-2 ${localMarks[currentStudent.id]?.status === 'absent' ? 'bg-error text-white border-error' : 'bg-error-container/10 border-transparent hover:border-error text-error'} ${session.status !== 'draft' ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-4xl">close</span>
                <span className="font-label text-[10px] font-black uppercase mt-2">Absent</span>
              </button>
              
              <button 
                disabled={session.status !== 'draft'}
                onClick={() => handleMark('other')}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all active:scale-90 border-2 ${localMarks[currentStudent.id]?.status === 'other' ? 'bg-outline text-white border-outline' : 'bg-surface-container-high/50 border-transparent hover:border-outline text-on-surface-variant'} ${session.status !== 'draft' ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-4xl">circle</span>
                <span className="font-label text-[10px] font-black uppercase mt-2">Other</span>
              </button>

              <button 
                disabled={session.status !== 'draft'}
                onClick={() => handleMark('present')}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all active:scale-90 border-2 ${localMarks[currentStudent.id]?.status === 'present' ? 'bg-secondary text-white border-secondary' : 'bg-secondary-container/20 border-transparent hover:border-secondary text-secondary'} ${session.status !== 'draft' ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-4xl">check</span>
                <span className="font-label text-[10px] font-black uppercase mt-2">Present</span>
              </button>
            </section>
          </>
        ) : (
            <div className="text-center py-20">No students available for this class</div>
        )}

        {/* Horizontal Scroll Bar Navigation */}
        {students.length > 0 && (
            <section className="mt-10 mb-8">
            <div className="flex items-center justify-between px-2 mb-4">
                <h4 className="font-label text-[11px] font-black text-primary uppercase">Quick Jump</h4>
                <span className="font-label text-[10px] text-on-surface-variant">{currentIndex + 1} of {students.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x no-scrollbar">
                {students.map((s: any, idx: number) => {
                    const isCurrent = idx === currentIndex;
                    const hasStatus = localMarks[s.id];
                    let bgColor = isCurrent ? 'bg-primary' : 'bg-surface-container-low';
                    let textColor = isCurrent ? 'text-white' : 'text-on-surface-variant';
                    
                    // Add subtle indicator if already marked but not current
                    if (!isCurrent && hasStatus) {
                        if(hasStatus.status === 'present') { bgColor = 'bg-secondary-container/50'; textColor = 'text-primary' }
                        else if (hasStatus.status === 'absent') { bgColor = 'bg-error-container/50'; textColor = 'text-primary' }
                    }

                    return (
                        <button 
                            key={s.id} 
                            onClick={() => setCurrentIndex(idx)}
                            className={`snap-center flex-none w-12 h-12 flex items-center justify-center rounded-xl font-headline font-bold transition-colors ${bgColor} ${textColor} ${!isCurrent ? 'hover:bg-surface-container-high' : ''}`}
                        >
                            {idx + 1}
                        </button>
                    )
                })}
            </div>
            </section>
        )}

        {/* Dynamic Submit Button */}
        <div className="fixed bottom-28 left-0 w-full px-6 z-40 bg-gradient-to-t from-surface pb-4 pt-12">
          {session.status === 'submitted' || session.status === 'edited' ? (
              <div className="w-full max-w-md mx-auto h-14 bg-surface-container-highest text-on-surface font-headline font-bold flex items-center justify-center gap-3 rounded-full opacity-60">
                 <span className="material-symbols-outlined">lock</span>
                 <span>Session Submitted</span>
              </div>
          ) : (
            <button 
                disabled={!isReadyToSubmit || submitMutation.isPending}
                onClick={confirmSubmit}
                className={`w-full max-w-md mx-auto h-14 rounded-full font-headline font-bold flex items-center justify-center gap-3 transition-opacity ${isReadyToSubmit ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20 opacity-100 active:scale-[0.98]' : 'bg-primary text-white opacity-40 cursor-not-allowed'}`}
            >
                {submitMutation.isPending ? (
                    <span className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                ) : (
                    <>
                        <span>Submit Ledger</span>
                        <span className="material-symbols-outlined">send</span>
                    </>
                )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
