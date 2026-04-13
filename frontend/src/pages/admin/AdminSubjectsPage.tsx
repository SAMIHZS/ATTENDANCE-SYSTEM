import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Button } from '../../components/ui';

export function AdminSubjectsPage() {
  const queryClient = useQueryClient();
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  
  const { data: subjects, isLoading } = useQuery({
    queryKey: ['admin', 'subjects'],
    queryFn: adminApi.getSubjects,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createSubject(newSubject.name, newSubject.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] });
      setNewSubject({ name: '', code: '' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (sub: any) => adminApi.updateSubject(sub.id, sub.name, sub.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] });
    }
  });

  return (
    <div className="space-y-8 animate-in pb-32">
      {/* Carbon Style Header */}
      <div className="border-b border-outline-subtle pb-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
          Subject Catalog
        </h2>
        <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-[0.2em] font-bold opacity-60">
          Manage academic courses and identifiers
        </p>
      </div>

      {/* Carbon Style Input Group */}
      <div className="flex flex-wrap items-center gap-0 bg-surface-low border border-outline-subtle">
        <div className="flex-[2] min-w-[200px] relative border-r border-outline-subtle">
          <span className="material-symbols-outlined text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2 text-lg">book</span>
          <input
            type="text"
            value={newSubject.name}
            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            placeholder="Subject name (e.g. Data Structures)..."
            className="w-full h-11 pl-12 pr-4 bg-transparent font-body text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
          />
        </div>
        <div className="flex-1 min-w-[150px] relative border-r border-outline-subtle border-l-0">
          <span className="material-symbols-outlined text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2 text-lg">code</span>
              <input 
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  placeholder="Code (e.g. CS101)"
            className="w-full h-11 pl-12 pr-4 bg-transparent font-body text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
              />
        </div>
        <button
          onClick={() => { if(newSubject.name) createMutation.mutate() }}
          disabled={!newSubject.name || createMutation.isPending}
          className="flex items-center gap-3 bg-primary text-white h-11 px-8 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          <span>Catalog Subject</span>
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      {/* Carbon DataTable Style */}
      <div className="bg-white border border-outline-subtle overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-surface-low border-b border-outline-subtle">
                <tr>
                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Course Nomenclature</th>
                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Academic Identifier</th>
                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-right">Settings</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-outline-subtle">
                {isLoading && <tr><td colSpan={3} className="p-12 text-center text-on-surface-variant font-mono text-xs uppercase tracking-tighter opacity-50">Syncing catalog...</td></tr>}
                {subjects?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-surface-low transition-colors group">
                        <td className="p-4">
                           <input 
                              defaultValue={s.name}
                              onBlur={(e) => {
                                  if(e.target.value !== s.name && e.target.value) {
                                      updateMutation.mutate({ ...s, name: e.target.value });
                                  }
                              }}
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary/40 rounded-none p-1 font-headline text-sm font-bold text-on-surface outline-none"
                           />
                        </td>
                        <td className="p-4">
                           <input 
                              defaultValue={s.code || ''}
                              onBlur={(e) => {
                                  if(e.target.value !== (s.code || '')) {
                                      updateMutation.mutate({ ...s, code: e.target.value });
                                  }
                              }}
                              placeholder="NO CODE"
                              className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary/40 rounded-none p-1 font-mono text-xs text-on-surface-variant outline-none"
                           />
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                </button>
                                <button className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
