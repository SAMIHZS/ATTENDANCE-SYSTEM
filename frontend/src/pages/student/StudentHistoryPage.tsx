import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../api/student';
import { useNavigate } from 'react-router-dom';

export function StudentHistoryPage() {
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['student', 'history', filterDate, filterSubject],
    queryFn: () => studentApi.getHistory({ date: filterDate, subjectId: filterSubject }),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['student', 'summary'],
    queryFn: studentApi.getSummary,
  });

  const history = historyData ?? [];
  const subjects = summaryData?.subjects ?? [];

  return (
    <div className="animate-in pb-32">
      <div className="pt-8 flex items-center gap-4 mb-10">
         <button onClick={() => navigate('/student')} className="w-8 h-8 flex items-center justify-center rounded-role bg-white/[0.05] border border-white/[0.08] text-on-surface-variant hover:text-on-surface transition-all">
            <span className="material-symbols-outlined text-[18px]">west</span>
         </button>
         <div>
            <h2 className="font-headline font-signature text-xl font-bold tracking-tight text-on-surface">
               Session History
            </h2>
            <div className="h-px w-6 bg-primary opacity-40 mt-1" />
         </div>
      </div>

      {/* Linear Style Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <div className="relative flex-1 min-w-[140px]">
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] text-xs font-label font-bold uppercase tracking-widest text-on-surface rounded-role px-4 h-10 outline-none focus:border-primary/40 transition-all"
          />
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] text-xs font-label font-bold uppercase tracking-widest text-on-surface rounded-role px-4 h-10 outline-none focus:border-primary/40 appearance-none transition-all"
          >
            <option value="" className="bg-surface-high">All Subjects</option>
            {subjects.map((s: any) => (
              <option key={s.subject.id} value={s.subject.id} className="bg-surface-high">
                {s.subject.name}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant opacity-30 pointer-events-none">expand_more</span>
        </div>
        <button 
          onClick={() => { setFilterDate(''); setFilterSubject(''); }}
          className="h-10 px-5 text-[10px] uppercase font-bold tracking-[0.2em] text-on-surface-variant border border-transparent hover:border-white/[0.05] hover:bg-white/[0.02] rounded-role transition-all"
        >
          Reset
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <span className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <section className="space-y-3">
          {history.length > 0 ? history.map((record: any) => {
            const isPresent = record.status === 'present';
            
            return (
              <div key={record.id} className="group relative flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] rounded-role hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-1 h-8 rounded-full ${isPresent ? 'bg-secondary/40' : 'bg-error/40'}`} />
                  <div>
                    <h3 className="font-headline font-signature text-sm font-bold text-on-surface mb-0.5">
                      {record.subject?.name || 'Academic Session'}
                    </h3>
                    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-40">
                      {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} &bull; {record.start_time.slice(0, 5)} {record.end_time ? `- ${record.end_time.slice(0, 5)}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`font-label text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${isPresent ? 'text-secondary border-secondary/20 bg-secondary/5' : 'text-error border-error/20 bg-error/5'}`}>
                    {record.status}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-20 opacity-20">
              <span className="material-symbols-outlined text-4xl mb-4">history_toggle_off</span>
              <p className="font-label text-xs uppercase font-bold tracking-widest">Archive Empty</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
