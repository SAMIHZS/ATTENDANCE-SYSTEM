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
    <div className="pt-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface">Subjects</h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl">
            Manage course subjects and codes.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-6 shadow-sm border border-outline-variant/30 flex gap-4 items-end">
         <div className="flex-[2]">
             <label className="block text-sm font-medium text-on-surface-variant mb-1">Subject Name</label>
             <input 
                 value={newSubject.name}
                 onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                 className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                 placeholder="e.g. Artificial Intelligence"
             />
         </div>
         <div className="flex-1">
             <label className="block text-sm font-medium text-on-surface-variant mb-1">Code (Optional)</label>
             <input 
                 value={newSubject.code}
                 onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                 className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                 placeholder="e.g. CS101"
             />
         </div>
         <Button 
            onClick={() => { if(newSubject.name) createMutation.mutate() }}
            disabled={!newSubject.name || createMutation.isPending}
            variant="primary"
         >
             Add Subject
         </Button>
      </div>

      <div className="bg-surface-container-low rounded-3xl overflow-hidden shadow-sm border border-outline-variant/30">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-surface-container-highest border-b border-outline-variant/50">
                    <th className="p-4 font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider">Subject Name</th>
                    <th className="p-4 font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider">Course Code</th>
                    <th className="p-4 font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider w-32 border-l border-outline-variant/30 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {isLoading && <tr><td colSpan={3} className="p-4 text-center text-on-surface-variant">Loading...</td></tr>}
                {subjects?.map((s: any) => (
                    <tr key={s.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container/50 transition-colors">
                        <td className="p-4">
                           <input 
                              defaultValue={s.name}
                              onBlur={(e) => {
                                  if(e.target.value !== s.name && e.target.value) {
                                      updateMutation.mutate({ ...s, name: e.target.value });
                                  }
                              }}
                              className="w-full bg-transparent border-0 focus:ring-2 focus:ring-primary/20 rounded p-1"
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
                              className="w-full bg-transparent border-0 focus:ring-2 focus:ring-primary/20 rounded p-1 font-mono text-sm"
                           />
                        </td>
                        <td className="p-4 border-l border-outline-variant/30 text-center">
                            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer text-lg">edit</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
