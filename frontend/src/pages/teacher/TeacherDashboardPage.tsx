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
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-24">
      {/* Hero Section: Current Live Class */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4 pl-2">
          <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-primary">
            Current Live Class
          </h2>
          {liveClass?.slot && (
            <span className="flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-on-tertiary-fixed rounded-full"></span> Live
            </span>
          )}
        </div>

        {liveClass?.slot ? (
          <div className="relative overflow-hidden rounded-3xl bg-primary-container p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-20 blur-[60px] -mr-16 -mt-16"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-block px-3 py-1 bg-white/10 rounded-lg text-white/60 font-label text-xs tracking-wide">
                  Section: {liveClass.slot.class.name}
                </div>
                <h3 className="text-white font-headline text-3xl font-black leading-tight">
                  {liveClass.slot.subject.name}
                </h3>
                <div className="flex items-center gap-2 text-white/70">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="font-label text-sm tracking-tight">
                    {liveClass.slot.start_time.slice(0, 5)} - {liveClass.slot.end_time.slice(0, 5)}
                  </span>
                </div>
              </div>

              {liveClass.existing_session && (liveClass.existing_session.status === 'submitted' || liveClass.existing_session.status === 'edited') ? (
                <div className="group w-full md:w-auto h-14 px-8 bg-surface-container/20 text-white font-headline font-bold rounded-2xl flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Submitted</span>
                </div>
              ) : liveClass.existing_session ? (
                <button
                  onClick={() => handleResumeAttendance(liveClass.existing_session.id)}
                  className="group w-full md:w-auto h-14 px-8 bg-primary text-white border border-secondary font-headline font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
                >
                  <span>Resume Roll Call</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={handleStartAttendance}
                  className="group w-full md:w-auto h-14 px-8 bg-secondary hover:bg-secondary-fixed text-white font-headline font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
                >
                  <span>Start Attendance</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              )}
            </div>

            {/* Subtle Data Overlay matching Stitch */}
            <div className="mt-8 pt-6 border-t border-white/5 flex gap-8">
              <div className="flex flex-col">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Status</span>
                <span className="text-white font-headline text-xl font-bold">
                  {(liveClass.existing_session?.status === 'submitted' || liveClass.existing_session?.status === 'edited') ? 'Complete' : liveClass.existing_session ? 'In Progress' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 text-center editorial-shadow">
            <span className="material-symbols-outlined text-4xl text-outline mb-3">coffee</span>
            <h3 className="font-headline font-bold text-lg text-primary">No Live Class</h3>
            <p className="text-sm text-on-surface-variant font-body">
              You do not have a class scheduled at this time.
            </p>
          </div>
        )}
      </section>

      {/* Upcoming Classes Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 pl-2">
          <h2 className="font-headline font-bold text-xl tracking-tight text-primary">Upcoming Classes</h2>
          <button className="text-secondary font-label font-semibold text-sm">View All</button>
        </div>
        
        <div className="space-y-4">
          {upcomingClasses.length > 0 ? upcomingClasses.map((item: any) => (
            <div key={item.id} className="group flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl editorial-shadow hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined font-bold">book</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-on-surface">{item.subject.name}</h4>
                  <div className="flex items-center gap-2 text-on-surface-variant font-label text-xs">
                    <span>{item.class.name}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    <span>{item.start_time.slice(0, 5)}</span>
                  </div>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors">chevron_right</span>
            </div>
          )) : (
            <p className="text-center text-on-surface-variant text-sm py-4">No upcoming classes today.</p>
          )}
        </div>
      </section>

      {/* Quick Insight Stats */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-secondary-container p-6 rounded-[2.5rem] flex flex-col justify-between aspect-square">
          <span className="material-symbols-outlined text-3xl text-on-secondary-container">person_check</span>
          <div>
            <span className="font-headline text-3xl font-black text-on-secondary-container">{totalPresent}</span>
            <p className="text-on-secondary-container/80 text-xs font-bold uppercase tracking-widest mt-1">Total Marked</p>
          </div>
        </div>
        <div className="bg-surface-container-highest p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
          <div>
            <span className="font-headline text-2xl font-black text-primary">{weeklyAvg}%</span>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mt-1">Weekly Avg</p>
          </div>
        </div>
      </section>
    </div>
  );
}
