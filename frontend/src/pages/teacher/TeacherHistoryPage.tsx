import { useQuery } from '@tanstack/react-query';
import { teacherApi } from '../../api/teacher';
import { useNavigate } from 'react-router-dom';

export function TeacherHistoryPage() {
  const navigate = useNavigate();
  const { data: historyRes, isLoading } = useQuery({
    queryKey: ['teacher', 'history', 1],
    queryFn: () => teacherApi.getHistory(1, 50),
  });

  const sessions = historyRes?.data ?? [];

  if (isLoading) {
    return (
      <div className="pt-24 px-6 flex justify-center">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-32">
      <div className="flex items-center gap-2 mb-6">
         <button onClick={() => navigate('/teacher')} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant active:scale-90 transition-all">
            <span className="material-symbols-outlined text-lg font-bold">arrow_back</span>
         </button>
         <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-primary">
           Attendance Ledger
         </h2>
      </div>
      
      <div className="space-y-4">
        {sessions.length > 0 ? sessions.map((session: any) => {
          const present = session.summary.present || 0;
          const total = session.summary.total || 0;
          const percent = total > 0 ? Math.round((present / total) * 100) : 0;
          
          return (
            <div key={session.id} className="bg-surface-container-lowest p-6 rounded-3xl editorial-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-headline font-bold text-lg text-primary">{session.actual_subject.name}</h3>
                  <div className="text-sm font-label text-on-surface-variant mt-1 flex gap-2">
                     <span>{session.class.name}</span>
                     <span>&bull;</span>
                     <span>{new Date(session.date).toLocaleDateString()}</span> 
                     <span>&bull;</span>
                     <span>{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                  </div>
                </div>
                <span className="bg-tertiary-container/30 text-tertiary-fixed font-label text-xs font-bold px-2 py-1 rounded-full">
                  Submitted
                </span>
              </div>
              
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-outline-variant/20">
                <div className="flex-1">
                  <div className="flex justify-between font-label text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-widest">
                    <span>Present</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-headline text-xl font-bold text-primary">{present}</span>
                  <span className="text-on-surface-variant text-sm">/{total}</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <p className="text-on-surface-variant text-center py-10 font-body">
            No attendance history found.
          </p>
        )}
      </div>
    </div>
  );
}
