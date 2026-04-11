import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../api/student';
import { Link } from 'react-router-dom';

export function StudentDashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['student', 'summary'],
    queryFn: studentApi.getSummary,
  });

  if (isLoading) {
    return (
      <div className="pt-24 px-6 max-w-2xl mx-auto flex justify-center mt-20">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const overall = summary?.overall ?? { percentage: 0, total: 0, attended: 0, absent: 0 };
  const subjects = summary?.subjects ?? [];

  return (
    <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8 pb-32">
      {/* Hero Stats Section */}
      <section className="relative overflow-hidden bg-primary-container text-white p-8 rounded-[2rem] shadow-2xl">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center">
          <span className="font-label text-xs uppercase tracking-widest text-on-primary-container mb-2">
            Academic Standing
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-7xl font-extrabold tracking-tighter">
              {overall.percentage}
            </span>
            <span className="font-headline text-3xl font-bold text-secondary-fixed-dim">%</span>
          </div>
          <p className="font-body text-sm text-on-primary-container mt-2 opacity-80">Overall Attendance</p>
          
          <div className="mt-8 flex gap-4 w-full">
            <div className="flex-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-secondary-fixed-dim tracking-tight">
                Present
              </span>
              <span className="text-xl font-headline font-bold">{overall.attended}</span>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-md p-4 rounded-2xl">
              <span className="block text-[10px] uppercase font-bold text-error tracking-tight">
                Absent
              </span>
              <span className="text-xl font-headline font-bold">{overall.absent}</span>
            </div>
          </div>
          
          <div className="mt-6 w-full text-center">
             <Link to="/student/history" className="text-sm font-label text-on-primary-container hover:text-white hover:underline transition-all">
                View History &rarr;
             </Link>
          </div>
        </div>
      </section>

      {/* Subject-wise Grid */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-headline text-2xl font-bold tracking-tight">Course Insights</h2>
          <span className="font-label text-xs text-on-surface-variant font-medium">Semester 04</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {subjects.length > 0 ? subjects.map((subj: any) => {
            // Highlight shortage if attendance is below roughly 75%
            const isShortage = subj.percentage < 75;
            
            return (
              <div 
                key={subj.subject.id} 
                className={`bg-surface-container-lowest p-6 rounded-3xl group transition-all hover:bg-white hover:shadow-xl ${isShortage ? 'border-l-4 border-error' : ''}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {subj.subject.code}
                    </span>
                    <h3 className="font-headline text-xl font-bold mt-2">{subj.subject.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className={`font-headline text-2xl font-extrabold ${isShortage ? 'text-error' : 'text-primary'}`}>
                      {subj.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${isShortage ? 'bg-error' : 'bg-secondary'}`} 
                    style={{ width: `${subj.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-4 flex justify-between text-on-surface-variant font-label text-[10px]">
                  <span>{subj.subject.is_core ? 'Core Course' : 'Elective Course'}</span>
                  <span>{subj.attended} / {subj.total} Classes</span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-on-surface-variant py-8 font-label">
              No subjects data available.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
