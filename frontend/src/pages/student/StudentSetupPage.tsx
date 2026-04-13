import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi } from '../../api/student';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui';

type SetupStep = 'class-select' | 'identity-check' | 'confirm-binding';

export function StudentSetupPage() {
  const [step, setStep] = useState<SetupStep>('class-select');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoBindInfo, setAutoBindInfo] = useState<any | null>(null);

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: studentApi.getClasses
  });

  // Check college email binding on mount
  useEffect(() => {
    const checkCollegeEmail = async () => {
      try {
        const res = await apiClient.post('/student/check-college-email');
        if (res.data.canBind) {
          setAutoBindInfo(res.data);
          setStep('identity-check');
        }
      } catch (err: any) {
        console.log('No college email binding available');
      }
    };
    checkCollegeEmail();
  }, []);

  // Query candidates when class selected and on search
  const { data: candidates, isFetching: loadingCandidates } = useQuery({
    queryKey: ['candidates', selectedClass, searchQuery],
    queryFn: async () => {
      if (!selectedClass) return [];
      const res = await apiClient.get('/student/candidates', {
        params: { classId: selectedClass, q: searchQuery || undefined }
      });
      return res.data.data || [];
    },
    enabled: step === 'identity-check' && !autoBindInfo && !!selectedClass,
    staleTime: 30000
  });

  // Auto-bind mutation (college email)
  const autoBindMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/student/bind-via-college-email');
      return res.data;
    },
    onSuccess: () => {
      window.location.href = '/student';
    },
    onError: (err: any) => {
      setError(err instanceof Error ? err.message : 'Failed to bind via college email');
      setAutoBindInfo(null);
    }
  });

  // Bind to selected candidate
  const bindMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiClient.post('/student/bind-roll', { studentId });
      return res.data;
    },
    onSuccess: () => {
      window.location.href = '/student';
    },
    onError: (err: any) => {
      setError(err instanceof Error ? err.message : 'Failed to bind identity');
    }
  });

  // Request teacher access (optional, used later)
  // const requestTeacherMutation = useMutation({
  //   mutationFn: async () => {
  //     const res = await apiClient.post('/auth/request-teacher');
  //     return res.data;
  //   }
  // });

  const handleClassSelect = () => {
    setSelectedClass(selectedClass);
    setStep('identity-check');
    setError(null);
  };

  const handleCandidateSelect = (candidate: any) => {
    setSelectedCandidate(candidate);
    setStep('confirm-binding');
    setError(null);
  };

  const handleConfirmBinding = async () => {
    if (autoBindInfo?.studentId) {
      autoBindMutation.mutate();
    } else if (selectedCandidate?.id) {
      bindMutation.mutate(selectedCandidate.id);
    }
  };

  const handleBack = () => {
    if (step === 'confirm-binding') {
      if (autoBindInfo) {
        setStep('identity-check');
      } else {
        setSelectedCandidate(null);
        setStep('identity-check');
      }
    } else if (step === 'identity-check') {
      setAutoBindInfo(null);
      setSelectedCandidate(null);
      setSearchQuery('');
      setStep('class-select');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant/10">
        
        {/* STEP 1: CLASS SELECT */}
        {step === 'class-select' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-white mb-6 shadow-xl">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            
            <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Select Your Class</h1>
            <p className="text-on-surface-variant text-sm mb-8">Start by choosing your class. This helps us find your student record.</p>

            {error && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <div className="space-y-2 mb-8 text-left">
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
              onClick={handleClassSelect}
              disabled={!selectedClass}
              className="w-full h-14 bg-secondary text-white rounded-2xl font-bold shadow-lg shadow-secondary/20"
            >
              Next: Find Your Identity
            </Button>
          </div>
        )}

        {/* STEP 2: IDENTITY CHECK / SELECTION */}
        {step === 'identity-check' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-6 shadow-xl">
              <span className="material-symbols-outlined text-3xl">person_search</span>
            </div>
            
            {autoBindInfo?.canBind && !autoBindInfo?.alreadyBound ? (
              <>
                <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">College Email Detected</h1>
                <p className="text-on-surface-variant text-sm mb-6">Your college email matches our records. We found your student identity!</p>
                
                <div className="p-4 rounded-xl bg-success-container text-on-success-container mb-6 text-left">
                  <p className="text-sm font-semibold mb-1">{autoBindInfo.studentDetails?.fullName}</p>
                  <p className="text-xs">Roll: {autoBindInfo.studentDetails?.rollNumber}</p>
                </div>

                <p className="text-on-surface-variant text-xs mb-8">Ready to proceed? Click the button below to confirm and access your dashboard.</p>
              </>
            ) : (
              <>
                <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Find Your Identity</h1>
                <p className="text-on-surface-variant text-sm mb-8">Search for your name or roll number to claim your student record.</p>
                
                <div className="space-y-2 mb-6 text-left">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or roll number..."
                    className="w-full h-12 px-4 bg-surface rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                {/* Candidates list */}
                <div className="space-y-2 max-h-80 overflow-y-auto mb-6">
                  {loadingCandidates ? (
                    <div className="text-center py-8 text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      <p className="text-sm mt-2">Loading candidates...</p>
                    </div>
                  ) : candidates && candidates.length > 0 ? (
                    candidates.map((candidate: any) => (
                      <button
                        key={candidate.id}
                        onClick={() => handleCandidateSelect(candidate)}
                        className="w-full p-3 rounded-xl bg-surface border-2 border-outline-variant hover:border-primary hover:bg-surface-container text-left transition-all"
                      >
                        <p className="text-sm font-semibold text-on-surface">{candidate.full_name}</p>
                        <p className="text-xs text-on-surface-variant">Roll: {candidate.roll_number}</p>
                      </button>
                    ))
                  ) : searchQuery ? (
                    <p className="text-center py-8 text-on-surface-variant text-sm">No students found matching your search.</p>
                  ) : (
                    <p className="text-center py-8 text-on-surface-variant text-sm">Start typing to search for your record.</p>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 rounded-2xl"
              >
                Back
              </Button>
              <Button 
                onClick={() => setStep('confirm-binding')}
                disabled={autoBindInfo?.canBind ? autoBindMutation.isPending : !selectedCandidate}
                className="flex-1 h-12 bg-primary text-white rounded-2xl font-bold"
              >
                {autoBindInfo?.canBind ? 'Proceed' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRM BINDING */}
        {step === 'confirm-binding' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tertiary text-white mb-6 shadow-xl">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            
            <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-2">Confirm Identity Binding</h1>
            <p className="text-on-surface-variant text-sm mb-8">Review your information before confirming. You won't be able to change this later.</p>

            {(autoBindInfo || selectedCandidate) && (
              <div className="p-4 rounded-xl bg-surface-container mb-6 text-left border-2 border-outline-variant/20">
                <p className="text-sm font-semibold text-on-surface mb-3">
                  {autoBindInfo?.studentDetails?.fullName || selectedCandidate?.full_name}
                </p>
                <div className="space-y-2 text-xs text-on-surface-variant">
                  <p>Roll Number: <span className="text-on-surface font-semibold">{autoBindInfo?.studentDetails?.rollNumber || selectedCandidate?.roll_number}</span></p>
                  <p>Class: <span className="text-on-surface font-semibold">{classes?.find((c: any) => c.id === selectedClass)?.name || selectedClass}</span></p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <p className="text-on-surface-variant text-xs mb-8">By confirming, you're claiming this student identity as your own.</p>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleBack}
                disabled={bindMutation.isPending || autoBindMutation.isPending}
                className="flex-1 h-12 rounded-2xl"
              >
                Back
              </Button>
              <Button 
                onClick={handleConfirmBinding}
                disabled={bindMutation.isPending || autoBindMutation.isPending || (!autoBindInfo?.studentId && !selectedCandidate?.id)}
                className="flex-1 h-12 bg-tertiary text-white rounded-2xl font-bold"
              >
                {bindMutation.isPending || autoBindMutation.isPending ? 'Confirming...' : 'Confirm & Continue'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
