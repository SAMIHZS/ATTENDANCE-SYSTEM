import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Button } from '../../components/ui';

export function AdminClassesPage() {
  const queryClient = useQueryClient();
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
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => adminApi.updateClass(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'classes'] });
    }
  });

  return (
    <div className="pt-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface">Classes</h2>
          <p className="text-on-surface-variant mt-2 max-w-2xl">
            Manage academic batches and class groupings.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-6 shadow-sm border border-outline-variant/30 flex gap-4 items-end">
         <div className="flex-1">
             <label className="block text-sm font-medium text-on-surface-variant mb-1">New Class Name</label>
             <input 
                 value={newClassName}
                 onChange={(e) => setNewClassName(e.target.value)}
                 className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                 placeholder="e.g. BCA 4th Semester"
             />
         </div>
         <Button 
            onClick={() => { if(newClassName) createMutation.mutate(newClassName) }}
            disabled={!newClassName || createMutation.isPending}
            variant="primary"
         >
             Add Class
         </Button>
      </div>

      <div className="bg-surface-container-low rounded-3xl overflow-hidden shadow-sm border border-outline-variant/30">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-surface-container-highest border-b border-outline-variant/50">
                    <th className="p-4 font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider">Class Name</th>
                    <th className="p-4 font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider w-32 border-l border-outline-variant/30 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {isLoading && <tr><td colSpan={2} className="p-4 text-center text-on-surface-variant">Loading...</td></tr>}
                {classes?.map((c: any) => (
                    <tr key={c.id} className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container/50 transition-colors">
                        <td className="p-4">
                           <input 
                              defaultValue={c.name}
                              onBlur={(e) => {
                                  if(e.target.value !== c.name && e.target.value) {
                                      updateMutation.mutate({ id: c.id, name: e.target.value });
                                  }
                              }}
                              className="w-full bg-transparent border-0 focus:ring-2 focus:ring-primary/20 rounded p-1"
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
