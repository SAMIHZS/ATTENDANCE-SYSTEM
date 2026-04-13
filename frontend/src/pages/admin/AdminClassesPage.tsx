import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { useToast } from '../../context/ToastContext';

export function AdminClassesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [newClassName, setNewClassName] = useState('');
  
  const { data: classes, isLoading } = useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: adminApi.getClasses,
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
      setNewClassName('');
      showToast('Batch created successfully', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to create batch', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => adminApi.updateClass(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
      showToast('Batch updated', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to update batch', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
      showToast('Batch deleted permanently', 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || 'Failed to delete class. Ensure it has no students first.', 'error')
  });

  return (
    <div className="space-y-8 animate-in pb-32">
      {/* Carbon Style Header */}
      <div className="border-b border-outline-subtle pb-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
          Batch Registry
        </h2>
        <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-[0.2em] font-bold opacity-60">
          Manage academic years and groupings
        </p>
      </div>

      {/* Carbon DataTable Search & Filters (Simulated for Creation) */}
      <div className="flex flex-wrap items-center gap-0 bg-surface-low border border-outline-subtle">
        <div className="flex-1 min-w-[300px] relative border-r border-outline-subtle">
          <span className="material-symbols-outlined text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2 text-lg">domain</span>
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="New batch name (e.g. BCA 6th Semester)..."
            className="w-full h-11 pl-12 pr-4 bg-transparent font-body text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
          />
        </div>
        <button
          onClick={() => { if(newClassName) createMutation.mutate(newClassName) }}
          disabled={!newClassName || createMutation.isPending}
          className="flex items-center gap-3 bg-primary text-white h-11 px-8 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          <span>{createMutation.isPending ? 'Provisioning...' : 'Provision Batch'}</span>
          <span className="material-symbols-outlined text-lg">{createMutation.isPending ? 'sync' : 'add'}</span>
        </button>
      </div>

      {/* Carbon DataTable Style */}
      <div className="bg-white border border-outline-subtle overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-surface-low border-b border-outline-subtle">
                <tr>
                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Resource Name / Identifier</th>
                    <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-right">Lifecycle Management</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-outline-subtle">
                {isLoading && (
                  <tr>
                    <td colSpan={2} className="p-12 text-center text-on-surface-variant font-mono text-xs uppercase tracking-tighter opacity-50">
                       <span className="inline-block animate-spin mr-2">sync</span>
                       Synchronizing registry...
                    </td>
                  </tr>
                )}
                {classes?.map((c: any) => (
                    <ClassRow 
                      key={c.id} 
                      c={c} 
                      onUpdate={(name: string) => updateMutation.mutate({ id: c.id, name })}
                      onDelete={() => { if(confirm(`Archive ${c.name}?`)) deleteMutation.mutate(c.id); }}
                      isUpdating={updateMutation.isPending && updateMutation.variables?.id === c.id}
                      isDeleting={deleteMutation.isPending && deleteMutation.variables === c.id}
                    />
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Extracted Row Component for performance and localized state
 */
function ClassRow({ c, onUpdate, onDelete, isUpdating, isDeleting }: any) {
    const [val, setVal] = useState(c.name);

    return (
        <tr className={`hover:bg-surface-low transition-colors group ${isDeleting ? 'opacity-30 pointer-events-none' : ''}`}>
            <td className="p-4 relative">
               <input 
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  onBlur={(e) => {
                      if(e.target.value !== c.name && e.target.value) {
                          onUpdate(e.target.value);
                      }
                  }}
                  className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-primary/40 rounded-none p-1 font-headline text-sm font-bold text-on-surface outline-none transition-all ${isUpdating ? 'opacity-50' : ''}`}
               />
               {isUpdating && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-primary font-bold uppercase animate-pulse">Saving</span>}
            </td>
            <td className="p-4 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onUpdate(val)}
                        className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-high transition-colors"
                        title="Force Save"
                    >
                        <span className="material-symbols-outlined text-[18px]">save</span>
                    </button>
                    <button 
                        onClick={onDelete}
                        className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-error/5 hover:text-error transition-colors"
                        title="Archive Batch"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </td>
        </tr>
    );
}
