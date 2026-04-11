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
    <div className="pt-24 px-6 max-w-2xl mx-auto pb-32">
      <div className="flex items-center gap-2 mb-6">
         <button onClick={() => navigate('/student')} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant active:scale-90 transition-all">
            <span className="material-symbols-outlined text-lg font-bold">arrow_back</span>
         </button>
         <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-primary">
            Attendance History
         </h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input 
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-surface-container-low text-on-surface-variant rounded-xl border-none text-sm px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-secondary"
        />
        <select 
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="bg-surface-container-low text-on-surface-variant rounded-xl border-none text-sm px-4 py-2 flex-1 outline-none focus:ring-2 focus:ring-secondary"
        >
          <option value="">All Subjects</option>
          {subjects.map((s: any) => (
            <option key={s.subject.id} value={s.subject.id}>
              {s.subject.name}
            </option>
          ))}
        </select>
        <button 
          onClick={() => { setFilterDate(''); setFilterSubject(''); }}
          className="text-on-surface-variant font-label text-xs uppercase font-bold tracking-widest px-4 hover:bg-surface-container rounded-xl transition-colors"
        >
          Clear
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
        </div>
      ) : (
        <section className="bg-surface-container-low rounded-[2rem] p-6">
          <div className="space-y-3">
            {history.length > 0 ? history.map((record: any) => {
              const isPresent = record.status === 'present';
              
              return (
                <div key={record.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPresent ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPresent ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold">{record.subject?.name || 'Class Session'}</p>
                      <p className="font-label text-[10px] text-on-surface-variant">
                        {new Date(record.date).toLocaleDateString()} &bull; {record.start_time.slice(0, 5)} - {record.end_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <span className={`font-label text-[10px] uppercase font-bold ${isPresent ? 'text-secondary' : 'text-error'}`}>
                    {record.status}
                  </span>
                </div>
              );
            }) : (
              <p className="text-center font-body text-sm text-on-surface-variant py-8">
                No attendance logs found for the selected criteria.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
