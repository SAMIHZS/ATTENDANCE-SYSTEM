import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Button } from '../../components/ui';

interface TeacherRequest {
  id: string;
  full_name: string;
  role: string;
  requested_teacher_at: string;
}

export function TeacherRequestsPage() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<TeacherRequest | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin', 'teacher-requests'],
    queryFn: adminApi.getPendingTeacherRequests,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const approveMutation = useMutation({
    mutationFn: (profileId: string) =>
      adminApi.approveTeacherRequest(profileId, employeeId || undefined),
    onSuccess: () => {
      setSuccessMessage('Teacher request approved successfully!');
      setSelectedRequest(null);
      setEmployeeId('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'teacher-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (profileId: string) =>
      adminApi.rejectTeacherRequest(profileId),
    onSuccess: () => {
      setSuccessMessage('Teacher request rejected.');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'teacher-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const handleApprove = (request: TeacherRequest) => {
    approveMutation.mutate(request.id);
  };

  const handleReject = (request: TeacherRequest) => {
    if (window.confirm(`Reject teacher request from ${request.full_name}?`)) {
      rejectMutation.mutate(request.id);
    }
  };

  const handleSelectRequest = (request: TeacherRequest) => {
    setSelectedRequest(request);
    setEmployeeId('');
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="border-b border-outline-subtle pb-6">
        <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight uppercase">
          Teacher Access Requests
        </h1>
        <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-[0.2em] font-bold opacity-60">
          Review and approve pending teacher role requests
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-success-container text-on-success-container text-sm flex items-center gap-2 border border-success/30">
          <span className="material-symbols-outlined">check_circle</span>
          {successMessage}
        </div>
      )}

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="border border-outline-subtle rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <span className="w-6 h-6 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-success opacity-40 block mb-4">
                  done_all
                </span>
                <p className="text-on-surface-variant font-semibold mb-2">No Pending Requests</p>
                <p className="text-on-surface-variant text-xs opacity-70">All teacher requests have been processed.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-subtle">
                {requests.map((request: TeacherRequest) => (
                  <button
                    key={request.id}
                    onClick={() => handleSelectRequest(request)}
                    className={`w-full p-6 text-left transition-all hover:bg-surface-container-low ${ selectedRequest?.id === request.id ? 'bg-primary-container/20 border-l-4 border-primary' : '' }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-on-surface mb-1">{request.full_name}</p>
                        <p className="text-xs text-on-surface-variant">
                          Requested:{' '}
                          {new Date(request.requested_teacher_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-warning text-2xl">
                        schedule
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats Card */}
          {requests.length > 0 && (
            <div className="mt-8 border border-outline-subtle bg-surface-container-low p-6 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                Request Statistics
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-3xl font-bold text-warning">{requests.length}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Pending Requests</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-on-surface">
                    {Math.round((new Date().getTime() - new Date(requests[0]?.requested_teacher_at).getTime()) / (1000 * 60 * 60 * 24))}d
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">Oldest Request Age</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="border border-outline-subtle rounded-2xl p-6 sticky top-24 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Selected Request
                </p>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-xs text-on-surface-variant mb-1">Full Name</p>
                    <p className="font-semibold text-on-surface">{selectedRequest.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant mb-1">Requested On</p>
                    <p className="font-semibold text-on-surface">
                      {new Date(selectedRequest.requested_teacher_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Employee ID Input (Optional) */}
              <div className="space-y-2">
                <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Employee ID (Optional)
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP001"
                  className="w-full h-11 px-4 bg-surface rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/50">
                <Button
                  onClick={() => handleApprove(selectedRequest)}
                  disabled={approveMutation.isPending}
                  className="w-full bg-success text-white rounded-xl font-semibold h-11"
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve Request'}
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest)}
                  disabled={rejectMutation.isPending}
                  variant="danger"
                  className="w-full rounded-xl font-semibold h-11"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
                </Button>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-info-container/10 border border-info/20 text-xs text-on-surface-variant">
                <p className="font-semibold text-on-surface mb-2">Approval Note:</p>
                <p>Approved users will be added as active teachers and can create/manage sessions immediately.</p>
              </div>
            </div>
          ) : requests.length > 0 ? (
            <div className="border border-outline-subtle/50 rounded-2xl p-6 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 block mb-3">
                touch_app
              </span>
              <p className="text-sm text-on-surface-variant">
                Select a request from the list to review and take action.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
