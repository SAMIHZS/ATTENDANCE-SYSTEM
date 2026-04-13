import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';

export function AdminSubjectsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
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
      showToast('Subject cataloged successfully', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to create subject', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: (sub: any) => adminApi.updateSubject(sub.id, sub.name, sub.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] });
      showToast('Subject updated', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to update subject', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subjects'] });
      showToast('Subject removed from catalog', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to delete subject.', 'error')
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
          <span>{createMutation.isPending ? 'Cataloging...' : 'Catalog Subject'}</span>
          <span className="material-symbols-outlined text-lg">{createMutation.isPending ? 'sync' : 'add'}</span>
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
                {isLoading && (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-on-surface-variant font-mono text-xs uppercase tracking-tighter opacity-50">
                       <span className="inline-block animate-spin mr-2">sync</span>
                       Syncing catalog...
                    </td>
                  </tr>
                )}
                {subjects?.map((s: any) => (
                    <SubjectRow 
                      key={s.id} 
                      s={s} 
                      onUpdate={(updates: any) => updateMutation.mutate({ ...s, ...updates })}
                      onDelete={() => { if(confirm(`Archive ${s.name}?`)) deleteMutation.mutate(s.id); }}
                      isUpdating={updateMutation.isPending && updateMutation.variables?.id === s.id}
                      isDeleting={deleteMutation.isPending && deleteMutation.variables === s.id}
                    />
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectRow({ s, onUpdate, onDelete, isUpdating, isDeleting }: any) {
    const [name, setName] = useState(s.name);
    const [code, setCode] = useState(s.code || '');

    return (
        <tr className={`hover:bg-surface-low transition-colors group ${isDeleting ? 'opacity-30 pointer-events-none' : ''}`}>
            <td className="p-4 relative">
               <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={(e) => {
                      if(e.target.value !== s.name && e.target.value) {
                          onUpdate({ name: e.target.value });
                      }
                  }}
                  className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-primary/40 rounded-none p-1 font-headline text-sm font-bold text-on-surface outline-none ${isUpdating ? 'opacity-50' : ''}`}
               />
               {isUpdating && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-primary animate-pulse font-bold uppercase">Sync</span>}
            </td>
            <td className="p-4">
               <input 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={(e) => {
                      if(e.target.value !== (s.code || '')) {
                          onUpdate({ code: e.target.value });
                      }
                  }}
                  placeholder="NO CODE"
                  className="w-full bg-transparent border-0 focus:ring-1 focus:ring-primary/40 rounded-none p-1 font-mono text-xs text-on-surface-variant outline-none"
               />
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onUpdate({ name, code })}
                        className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors"
                        title="Force Update"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                    </button>
                    <button 
                        onClick={onDelete}
                        className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors"
                        title="Archive Course"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    );
}
