import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../api/student';

export function StudentDashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['student', 'summary'],
    queryFn: studentApi.getSummary,
  });

  if (isLoading) {
    return (
      <div className="pt-24 flex justify-center">
        <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const overall = summary?.overall ?? { percentage: 0, total: 0, attended: 0, absent: 0 };
  const subjects = summary?.subjects ?? [];

  return (
    <main className="space-y-10 animate-in pb-32">
      {/* Header (Linear Style) */}
      <div className="pt-8 flex flex-col items-center">
        <h2 className="font-headline font-signature text-xl font-bold text-on-surface tracking-tight uppercase">Active Standing</h2>
        <div className="mt-1 h-px w-8 bg-primary/40" />
      </div>

      {/* Linear Metric Card */}
      <section className="relative group">
        <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
        <div className="relative bg-white/[0.03] border border-white/[0.08] p-10 rounded-[2.5rem] flex flex-col items-center backdrop-blur-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-headline font-signature text-[8rem] font-bold leading-none tracking-tighter text-on-surface">
              {overall.percentage}
            </span>
            <span className="font-headline font-signature text-2xl font-medium text-white/30">%</span>
          </div>
          <p className="font-label text-xs uppercase tracking-[0.3em] font-bold text-on-surface-variant mt-4 opacity-60 text-center">Cumulative Attendance</p>
          
          <div className="mt-10 flex gap-12 w-full justify-center">
            <div className="text-center group/stat">
              <span className="block text-[10px] uppercase font-bold text-secondary tracking-widest mb-1 group-hover/stat:text-primary transition-colors">
                Present
              </span>
              <span className="text-2xl font-headline font-signature font-bold text-on-surface">{overall.attended}</span>
            </div>
            <div className="text-center group/stat">
              <span className="block text-[10px] uppercase font-bold text-error tracking-widest mb-1 group-hover/stat:text-error transition-colors">
                Absent
              </span>
              <span className="text-2xl font-headline font-signature font-bold text-on-surface">{overall.absent}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Course Cards (Linear List) */}
      <section>
        <div className="flex justify-between items-center mb-6 pl-2">
          <h2 className="font-headline font-signature text-sm font-bold uppercase tracking-widest text-on-surface-variant">Course Metrics</h2>
          <span className="font-label text-[10px] text-primary font-bold uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-full">{summary?.className || 'ACTIVE'}</span>
        </div>
        
        <div className="space-y-4">
          {subjects.length > 0 ? subjects.map((subj: any) => {
            const isShortage = subj.percentage < 75;
            
            return (
              <div 
                key={subj.subject.id} 
                className="group relative bg-white/[0.02] border border-white/[0.05] p-5 rounded-role hover:bg-white/[0.04] transition-all"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] font-mono text-on-surface-variant opacity-40 uppercase tracking-tighter">
                      {subj.subject.code}
                    </span>
                    <h3 className="font-headline font-signature text-base font-bold text-on-surface mt-0.5">{subj.subject.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className={`font-headline font-signature text-xl font-bold ${isShortage ? 'text-error' : 'text-on-surface opacity-80'}`}>
                      {subj.percentage}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isShortage ? 'bg-error' : 'bg-primary'}`} 
                    style={{ width: `${subj.percentage}%` }}
                  ></div>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-40">
                  <span>{subj.subject.is_core ? 'Core' : 'Elec'}</span>
                  <span>{subj.attended} / {subj.total} U</span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-on-surface-variant py-12 opacity-30 text-xs font-bold uppercase tracking-widest">
              Data Synchronization Pending
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
