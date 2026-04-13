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
    <div className="pt-24 px-4 max-w-xl mx-auto pb-32 animate-in">
      <div className="flex items-center gap-3 mb-8 px-1">
         <button onClick={() => navigate('/teacher')} className="w-8 h-8 flex items-center justify-center rounded-role bg-white/[0.05] border border-white/[0.08] text-on-surface active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
         </button>
         <h2 className="font-headline font-signature text-xl tracking-tightest text-on-surface">
           Ledger History
         </h2>
      </div>
      
      <div className="space-y-3">
        {sessions.length > 0 ? sessions.map((session: any) => {
          const present = session.summary.present || 0;
          const total = session.summary.total || 0;
          const percent = total > 0 ? Math.round((present / total) * 100) : 0;
          
          return (
            <div key={session.id} className="bg-surface-elevated border border-outline border-white/[0.03] p-5 rounded-role hover:bg-white/[0.01] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-body font-bold text-sm text-on-surface leading-snug">{session.actual_subject.name}</h3>
                  <div className="text-[11px] font-label text-on-surface-variant mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 opacity-60">
                     <span className="font-bold">{session.class.name}</span>
                     <span className="text-white/20">/</span>
                     <span>{new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span> 
                     <span className="text-white/20">/</span>
                     <span>{session.start_time.slice(0, 5)} — {session.end_time.slice(0, 5)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
                  <span className="w-1 h-1 bg-secondary rounded-full"></span>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Logged</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.03]">
                <div className="flex-1">
                   <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }}></div>
                   </div>
                   <div className="flex justify-between items-center mt-2">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-50">Present Rate</span>
                     <span className="text-[10px] font-bold text-on-surface">{percent}%</span>
                   </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-headline text-lg font-signature text-on-surface">{present}</span>
                    <span className="text-on-surface-variant text-[10px] font-medium opacity-40">/{total}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant opacity-40">Total</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-20 border border-dashed border-white/[0.05] rounded-role">
            <span className="material-symbols-outlined text-white/5 text-4xl mb-3">folder_open</span>
            <p className="text-on-surface-variant/40 text-sm font-body">
              No logged sessions found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
