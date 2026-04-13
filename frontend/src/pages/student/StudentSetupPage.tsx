import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi } from '../../api/student';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui';

export function StudentSetupPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: studentApi.getClasses
  });

  const bindMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/student/bind-roll', {
        roll_number: rollNumber,
        class_id: selectedClass
      });
      return res.data;
    },
    onSuccess: () => {
       // Force reload profile or just navigate
       window.location.href = '/student'; 
    },
    onError: (err: any) => {
      setError(err instanceof Error ? err.message : 'Failed to bind roll number.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !selectedClass) return;
    bindMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant/10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-white mb-6 shadow-xl">
          <span className="material-symbols-outlined text-3xl">how_to_reg</span>
        </div>
        
        <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Complete Your Profile</h1>
        <p className="text-on-surface-variant text-sm mb-8">Please enter your roll number and select your class to access the student dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {error && (
            <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Roll Number</label>
            <input 
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 21BCA045"
              className="w-full h-14 px-4 bg-surface rounded-2xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Your Class</label>
            <select 
              required
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-14 px-4 bg-surface rounded-2xl border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all appearance-none"
            >
              <option value="">-- Choose your class --</option>
              {classes?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Button 
            type="submit"
            disabled={bindMutation.isPending || !rollNumber || !selectedClass}
            className="w-full h-14 bg-secondary text-white rounded-2xl font-bold mt-4 shadow-lg shadow-secondary/20"
          >
            {bindMutation.isPending ? 'Saving...' : 'Finish Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
}
