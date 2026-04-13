import { useQuery } from '@tanstack/react-query';
import { teacherApi } from '../../api/teacher';
import { useNavigate } from 'react-router-dom';

export function TeacherDashboardPage() {
  const navigate = useNavigate();

  // Queries
  const { data: liveClassResponse, isLoading: isLoadingLive } = useQuery({
    queryKey: ['teacher', 'live-class'],
    queryFn: teacherApi.getLiveClass,
  });

  const { data: todaySchedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['teacher', 'today-schedule'],
    queryFn: teacherApi.getTodaySchedule,
  });

  const { data: historyResponse } = useQuery({
    queryKey: ['teacher', 'history', 1],
    queryFn: () => teacherApi.getHistory(1, 7),
  });

  // Derived
  const liveClass = liveClassResponse; // could be null if no live class
  const upcomingClasses = (todaySchedule ?? []).filter(
    (s: any) => !s.is_live && s.start_time > new Date().toTimeString().slice(0, 5)
  );
  
  // Calculate Weekly Avg from history (mock logic for insights, using history)
  const history = historyResponse?.data ?? [];
  const totalStudents = history.reduce((acc: number, s: any) => acc + (s.summary.total || 0), 0);
  const totalPresent = history.reduce((acc: number, s: any) => acc + (s.summary.present || 0), 0);
  const weeklyAvg = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  const handleStartAttendance = async () => {
    if (!liveClass || !liveClass.slot) return;
    try {
      // Backend automatically checks idempotency — if one exists, it returns it
      const result = await teacherApi.startSession({
        class_id: liveClass.slot.class_id,
        date: liveClass.date,
        start_time: liveClass.slot.start_time,
        end_time: liveClass.slot.end_time,
        subject_id: liveClass.slot.subject_id,
        timetable_slot_id: liveClass.slot.id,
      });
      // Navigate to the roll call screen for this session
      navigate(`/sessions/${result.session.id}/roll-call`);
    } catch (e) {
      console.error('Failed to start session', e);
      alert('Failed to start session');
    }
  };

  const handleResumeAttendance = (sessionId: string) => {
    navigate(`/sessions/${sessionId}/roll-call`);
  };

  if (isLoadingLive || isLoadingSchedule) {
    return (
      <div className="pt-24 px-6 max-w-4xl mx-auto flex justify-center mt-20">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 px-4 max-w-xl mx-auto pb-24 animate-in">
      {/* Hero Section: Current Live Class */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="font-headline font-signature text-xl tracking-tightest text-on-surface">
            Live Session
          </h2>
          {liveClass?.slot && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
              <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Active</span>
            </div>
          )}
        </div>

        {liveClass?.slot ? (
          <div className="relative overflow-hidden rounded-role bg-surface-elevated border border-outline border-white/[0.03] p-8 shadow-2xl shadow-black/40">
            {/* Luminous glow effect like Linear */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
            
            <div className="relative z-10 flex flex-col gap-8">
              <div className="space-y-3">
                <div className="inline-flex px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-md text-on-surface-variant font-label text-[10px] uppercase tracking-widest">
                  {liveClass.slot.class.name}
                </div>
                <h3 className="text-on-surface font-headline text-3xl font-signature leading-tight tracking-tightest">
                  {liveClass.slot.subject.name}
                </h3>
                <div className="flex items-center gap-2.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span className="font-label text-sm tracking-tight font-medium">
                    {liveClass.slot.start_time.slice(0, 5)} — {liveClass.slot.end_time.slice(0, 5)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/[0.05]">
                <div className="flex flex-col">
                  <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold opacity-60">Status</span>
                  <span className="text-on-surface font-headline text-sm font-bold mt-0.5">
                    {(liveClass.existing_session?.status === 'submitted' || liveClass.existing_session?.status === 'edited') ? 'Complete' : liveClass.existing_session ? 'In Progress' : 'Awaiting Start'}
                  </span>
                </div>

                {liveClass.existing_session && (liveClass.existing_session.status === 'submitted' || liveClass.existing_session.status === 'edited') ? (
                  <div className="h-11 px-6 bg-white/[0.03] border border-white/[0.08] text-on-surface-variant font-headline font-bold rounded-role flex items-center gap-2 text-sm italic">
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                    <span>Class Logged</span>
                  </div>
                ) : liveClass.existing_session ? (
                  <button
                    onClick={() => handleResumeAttendance(liveClass.existing_session.id)}
                    className="h-11 px-8 bg-primary hover:bg-primary-hover text-white font-headline font-bold rounded-role flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 text-sm"
                  >
                    <span>Resume Session</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartAttendance}
                    className="h-11 px-8 bg-primary hover:bg-primary-hover text-white font-headline font-bold rounded-role flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 text-sm"
                  >
                    <span>Start Roll Call</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-outline border-white/[0.03] rounded-role py-12 px-6 text-center shadow-lg shadow-black/20">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-4 block">nightlight</span>
            <h3 className="font-headline font-bold text-base text-on-surface">No Active Class</h3>
            <p className="text-sm text-on-surface-variant font-body mt-1 max-w-[240px] mx-auto opacity-70">
              Your next scheduled class will appear here automatically.
            </p>
          </div>
        )}
      </section>

      {/* Upcoming Section (Linear Minimal List) */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="font-headline font-signature text-sm font-bold text-on-surface-variant uppercase tracking-widest">Today's Schedule</h2>
          <div className="flex gap-4">
            <button onClick={() => navigate('/teacher/timetable')} className="text-secondary font-label font-bold text-[11px] uppercase tracking-widest hover:underline">Full Timetable</button>
            <button onClick={() => navigate('/teacher/history')} className="text-primary font-label font-bold text-[11px] uppercase tracking-widest hover:underline">View History</button>
          </div>
        </div>
        
        <div className="rounded-role border border-outline border-white/[0.03] overflow-hidden bg-surface-elevated/50">
          {upcomingClasses.length > 0 ? upcomingClasses.map((item: any) => (
            <div key={item.id} className="group flex items-center justify-between p-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => {}}>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 border border-white/[0.05] bg-white/[0.02] rounded-role flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">bookmark</span>
                </div>
                <div>
                  <h4 className="font-body font-bold text-sm text-on-surface leading-snug">{item.subject.name}</h4>
                  <div className="flex items-center gap-2 text-on-surface-variant font-label text-[11px] mt-0.5">
                    <span className="font-bold">{item.class.name}</span>
                    <span className="opacity-30">/</span>
                    <span>{item.start_time.slice(0, 5)} — {item.end_time.slice(0, 5)}</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-on-surface-variant transition-colors">chevron_right</span>
            </div>
          )) : (
            <p className="text-center text-on-surface-variant text-xs py-8 opacity-50">No remaining classes for today.</p>
          )}
        </div>
      </section>

      {/* Quick Insight Stats (Linear Grid) */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-elevated border border-outline border-white/[0.03] p-6 rounded-role flex flex-col justify-between aspect-[16/9] md:aspect-video">
          <div className="flex items-center gap-2 text-secondary">
             <span className="material-symbols-outlined text-[18px]">verified_user</span>
             <span className="text-[10px] uppercase font-bold tracking-widest">Attendance</span>
          </div>
          <div>
            <span className="font-headline text-3xl font-signature text-on-surface">{totalPresent}</span>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Students Marked</p>
          </div>
        </div>
        <div className="bg-surface-elevated border border-outline border-white/[0.03] p-6 rounded-role flex flex-col justify-between aspect-[16/9] md:aspect-video">
          <div className="flex items-center gap-2 text-primary">
             <span className="material-symbols-outlined text-[18px]">analytics</span>
             <span className="text-[10px] uppercase font-bold tracking-widest">Engagement</span>
          </div>
          <div>
            <span className="font-headline text-3xl font-signature text-on-surface">{weeklyAvg}%</span>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Weekly Average</p>
          </div>
        </div>
      </section>
    </div>
  );
}
