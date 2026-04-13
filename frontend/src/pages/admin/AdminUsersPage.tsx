import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'teachers' | 'students';

interface TeacherRow {
  id: string;
  profile_id: string;
  employee_id: string | null;
  department: string | null;
  is_active: boolean;
  email: string;
  profile: { id: string; full_name: string } | null;
}

interface StudentRow {
  id: string;
  profile_id: string | null;
  roll_number: string;
  class_id: string;
  is_active: boolean;
  email: string;
  profile: { id: string; full_name: string } | null;
  class: { id: string; name: string } | null;
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('teachers');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  return (
    <div className="space-y-8 animate-in pb-32">
      {/* Header (IBM Carbon Style) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-subtle pb-6">
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">User Management</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Directory of all authenticated teachers and students in the BCA system.
          </p>
        </div>
        
        {/* Carbon Tabs Style */}
        <div className="flex border-b border-white">
          {(['teachers', 'students'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(''); }}
              className={`py-2 px-8 font-label text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-primary text-primary bg-surface-low'
                  : 'border-transparent text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Carbon DataTable Search & Filters */}
      <div className="flex flex-wrap items-center gap-0 bg-surface-low border border-outline-subtle">
        <div className="flex-1 min-w-[300px] relative border-r border-outline-subtle">
          <span className="material-symbols-outlined text-on-surface-variant/40 absolute left-4 top-1/2 -translate-y-1/2 text-lg">search</span>
          <input
            type="text"
            placeholder={`Filter ${activeTab} by name, email, or identifier...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-transparent font-body text-sm outline-none transition-all placeholder:text-on-surface-variant/40"
          />
        </div>
        <div className="flex items-center px-6 h-11 gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded-none border-on-surface-variant accent-primary"
            />
            <span className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Show Inactive</span>
          </label>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'teachers' ? (
        <TeachersTab search={search} showInactive={showInactive} />
      ) : (
        <StudentsTab search={search} showInactive={showInactive} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TEACHERS TAB ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function TeachersTab({ search, showInactive }: { search: string; showInactive: boolean }) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['admin', 'teachers', search, showInactive],
    queryFn: () => adminApi.getTeachers({ search: search || undefined, showInactive }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateTeacher(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Add Teacher (Carbon Primary Button) */}
      <div className="flex justify-end p-0">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 bg-primary text-white h-11 px-8 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-hover transition-colors"
        >
          <span>Add New Teacher</span>
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      {/* Carbon DataTable Style */}
      <div className="bg-white border border-outline-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-low border-b border-outline-subtle">
            <tr>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Teacher Name</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Authentication Email</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Employee ID</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-center">Lifecycle</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {(teachers ?? []).map((t: TeacherRow) => (
              <tr key={t.id} className={`border-b border-outline-subtle hover:bg-surface-low transition-colors group ${!t.is_active ? 'bg-surface-low/30' : ''}`}>
                <td className="p-4">
                  <span className="font-headline text-sm font-bold text-on-surface">{t.profile?.full_name ?? '—'}</span>
                </td>
                <td className="p-4 font-body text-xs text-on-surface-variant">{t.email || '—'}</td>
                <td className="p-4 font-mono text-xs text-on-surface-variant tracking-tighter">{t.employee_id || '—'}</td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${
                    t.is_active ? 'border-secondary/30 text-secondary bg-secondary/5' : 'border-error/30 text-error bg-error/5'
                  }`}>
                    {t.is_active ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-0 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(t.id)}
                      className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-high hover:text-primary transition-colors"
                      title="Edit Profile"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: t.id, isActive: !t.is_active })}
                      disabled={toggleActiveMutation.isPending}
                      className={`h-9 w-9 flex items-center justify-center transition-colors ${
                        t.is_active 
                          ? 'text-on-surface-variant hover:bg-error/5 hover:text-error' 
                          : 'text-on-surface-variant hover:bg-secondary/5 hover:text-secondary'
                      }`}
                      title={t.is_active ? 'Deactivate Account' : 'Reactive Account'}
                    >
                      <span className="material-symbols-outlined text-[18px]">{t.is_active ? 'person_off' : 'person_check'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(teachers ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">person_off</span>
                  No teachers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTeacherModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Edit Modal */}
      {editingId && (
        <EditTeacherModal
          teacher={(teachers ?? []).find((t: TeacherRow) => t.id === editingId)!}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STUDENTS TAB ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function StudentsTab({ search, showInactive }: { search: string; showInactive: boolean }) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['admin', 'classes'],
    queryFn: adminApi.getClasses,
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['admin', 'students', search, classFilter, showInactive],
    queryFn: () => adminApi.getStudents({
      search: search || undefined,
      classId: classFilter || undefined,
      showInactive,
    }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateStudent(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'students'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Airtable-inspired Controls Row */}
      <div className="flex flex-wrap items-center gap-0 bg-surface-low border border-outline-subtle mb-4">
        <div className="flex items-center px-4 h-11 border-r border-outline-subtle bg-white">
          <span className="material-symbols-outlined text-on-surface-variant/40 text-lg mr-2">filter_list</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-transparent font-body text-xs font-bold uppercase tracking-widest outline-none appearance-none cursor-pointer pr-4"
          >
            <option value="">All Batches</option>
            {(classes ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-3 bg-primary text-white h-11 px-8 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-hover transition-colors"
        >
          <span>Provision Student</span>
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      {/* Carbon DataTable Style */}
      <div className="bg-white border border-outline-subtle overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-low border-b border-outline-subtle">
            <tr>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Student Name</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Roll Number</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Batch</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface">Email (Binding)</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-center">Lifecycle</th>
              <th className="p-4 font-label text-[10px] font-bold uppercase tracking-widest text-on-surface text-right">Settings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {(students ?? []).map((s: StudentRow) => (
              <tr key={s.id} className={`border-b border-outline-subtle hover:bg-surface-low transition-colors group ${!s.is_active ? 'bg-surface-low/30' : ''}`}>
                <td className="p-4">
                  <span className="font-headline text-sm font-bold text-on-surface">{s.profile?.full_name ?? <span className="text-on-surface-variant italic opacity-50">Unlinked</span>}</span>
                </td>
                <td className="p-4 font-mono text-xs font-bold text-primary tracking-tight">{s.roll_number}</td>
                <td className="p-4 font-body text-xs text-on-surface-variant">{s.class?.name ?? '—'}</td>
                <td className="p-4 font-body text-xs text-on-surface-variant">{s.email || <span className="italic opacity-30 text-[10px]">Awaiting First Login</span>}</td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${
                    s.is_active ? 'border-secondary/30 text-secondary bg-secondary/5' : 'border-error/30 text-error bg-error/5'
                  }`}>
                    {s.is_active ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex gap-0 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingId(s.id)}
                      className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-high hover:text-primary transition-colors"
                      title="Update Record"
                    >
                      <span className="material-symbols-outlined text-[18px]">contact_page</span>
                    </button>
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.is_active })}
                      disabled={toggleActiveMutation.isPending}
                      className={`h-9 w-9 flex items-center justify-center transition-colors ${
                        s.is_active 
                          ? 'text-on-surface-variant hover:bg-error/5 hover:text-error' 
                          : 'text-on-surface-variant hover:bg-secondary/5 hover:text-secondary'
                      }`}
                      title={s.is_active ? 'Suspend Access' : 'Restore Access'}
                    >
                      <span className="material-symbols-outlined text-[18px]">{s.is_active ? 'block' : 'undo'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(students ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">person_off</span>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateStudentModal
          classes={classes ?? []}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingId && (
        <EditStudentModal
          student={(students ?? []).find((s: StudentRow) => s.id === editingId)!}
          classes={classes ?? []}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── MODALS ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-in fade-in" onClick={onClose}>
      <div
        className="relative bg-white w-full max-w-lg shadow-2xl border border-outline-subtle animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Create Teacher Modal ───────────────────────────────────────────────────

function CreateTeacherModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fullName: '', email: '', employeeId: '', initialPassword: '' });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => adminApi.createTeacher({
      fullName: form.fullName,
      email: form.email,
      employeeId: form.employeeId || undefined,
      initialPassword: form.initialPassword || undefined,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
      alert(data.message || 'Teacher created successfully.');
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create teacher.');
    },
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between p-6 border-b border-outline-subtle bg-surface-low">
        <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest">
          Register New Teacher
        </h3>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="p-8">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error text-[11px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-6">
          <FormField label="Full Name" required>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="e.g. Dr. Jane Smith"
              className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
            />
          </FormField>

          <FormField label="Email Address" required>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane.smith@university.edu"
              className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Employee ID">
              <input
                value={form.employeeId}
                onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}
                placeholder="T-001"
                className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
              />
            </FormField>

            <FormField label="Initial Pass">
              <input
                type="password"
                value={form.initialPassword}
                onChange={(e) => setForm(f => ({ ...f, initialPassword: e.target.value }))}
                placeholder="••••••••"
                className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
              />
            </FormField>
          </div>

          <div className="flex gap-0 mt-8">
            <button type="button" onClick={onClose}
              className="flex-1 h-12 border border-outline-subtle text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-surface-low transition-colors">
              Discard
            </button>
            <button type="submit" disabled={createMutation.isPending || !form.fullName || !form.email}
              className="flex-1 h-12 bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-all">
              {createMutation.isPending ? 'Processing...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Edit Teacher Modal ─────────────────────────────────────────────────────

function EditTeacherModal({ teacher, onClose }: { teacher: TeacherRow; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fullName: teacher.profile?.full_name ?? '',
    employeeId: teacher.employee_id ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateTeacher(teacher.id, {
      fullName: form.fullName,
      employeeId: form.employeeId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to update teacher.');
    },
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between p-6 border-b border-outline-subtle bg-surface-low">
        <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest">
          Modify Teacher Record
        </h3>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="p-8">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error text-[11px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-6">
          <FormField label="Identifier (Read-Only)">
            <input value={teacher.email || '—'} readOnly className="form-input rounded-none border-outline-subtle bg-surface-low/50 cursor-not-allowed opacity-60 px-4 h-11" />
          </FormField>

          <FormField label="Full Display Name" required>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
            />
          </FormField>

          <FormField label="Employee ID">
            <input
              value={form.employeeId}
              onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))}
              placeholder="T-001"
              className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
            />
          </FormField>

          <div className="flex gap-0 mt-8">
            <button type="button" onClick={onClose}
              className="flex-1 h-12 border border-outline-subtle text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-surface-low transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending || !form.fullName}
              className="flex-1 h-12 bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-all">
              {updateMutation.isPending ? 'Updating...' : 'Commit Changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Create Student Modal ───────────────────────────────────────────────────

function CreateStudentModal({ classes, onClose }: { classes: any[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fullName: '', email: '', classId: '', rollNumber: '' });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => adminApi.createStudent({
      fullName: form.fullName,
      email: form.email || undefined,
      classId: form.classId,
      rollNumber: form.rollNumber,
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      alert(data.message || 'Student created successfully.');
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create student.');
    },
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between p-6 border-b border-outline-subtle bg-surface-low">
        <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest">
          Student Enrollment
        </h3>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="p-8">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error text-[11px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-6">
          <FormField label="Full Name" required>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Full legal name"
              className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
            />
          </FormField>

          <FormField label="Pre-bind Email (Optional)">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Binding student to this email"
              className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Academic Batch" required>
              <select
                required
                value={form.classId}
                onChange={(e) => setForm(f => ({ ...f, classId: e.target.value }))}
                className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11 appearance-none bg-white"
              >
                <option value="">Select</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Roll Number" required>
              <input
                required
                value={form.rollNumber}
                onChange={(e) => setForm(f => ({ ...f, rollNumber: e.target.value }))}
                placeholder="21BCA..."
                className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
              />
            </FormField>
          </div>

          <div className="flex gap-0 mt-8">
            <button type="button" onClick={onClose}
              className="flex-1 h-12 border border-outline-subtle text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-surface-low transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending || !form.fullName || !form.classId || !form.rollNumber}
              className="flex-1 h-12 bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-all">
              {createMutation.isPending ? 'Enrolling...' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ─── Edit Student Modal ─────────────────────────────────────────────────────

function EditStudentModal({ student, classes, onClose }: { student: StudentRow; classes: any[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fullName: student.profile?.full_name ?? '',
    classId: student.class_id ?? '',
    rollNumber: student.roll_number ?? '',
  });
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateStudent(student.id, {
      fullName: form.fullName || undefined,
      classId: form.classId,
      rollNumber: form.rollNumber,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to update student.');
    },
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between p-6 border-b border-outline-subtle bg-surface-low">
        <h3 className="font-headline text-sm font-bold text-on-surface uppercase tracking-widest">
          Edit Student Data
        </h3>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="p-8">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error text-[11px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-6">
          <FormField label="Display Name">
            <input
              value={form.fullName}
              onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              disabled={!student.profile_id}
              className={`form-input rounded-none border-outline-subtle px-4 h-11 ${!student.profile_id ? 'bg-surface-low/50 cursor-not-allowed opacity-60' : 'focus:border-primary'}`}
            />
          </FormField>

          <FormField label="Binding Identifier (Read-Only)">
            <input
              value={student.email || 'Awaiting Link'}
              readOnly
              className="form-input rounded-none border-outline-subtle bg-surface-low/50 cursor-not-allowed opacity-60 px-4 h-11"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Batch" required>
              <select
                required
                value={form.classId}
                onChange={(e) => setForm(f => ({ ...f, classId: e.target.value }))}
                className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11 appearance-none bg-white"
              >
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Roll No." required>
              <input
                required
                value={form.rollNumber}
                onChange={(e) => setForm(f => ({ ...f, rollNumber: e.target.value }))}
                className="form-input rounded-none border-outline-subtle focus:border-primary px-4 h-11"
              />
            </FormField>
          </div>

          <div className="flex gap-0 mt-8">
            <button type="button" onClick={onClose}
              className="flex-1 h-12 border border-outline-subtle text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-surface-low transition-colors">
              Discard
            </button>
            <button type="submit" disabled={updateMutation.isPending}
              className="flex-1 h-12 bg-primary text-white font-bold text-xs uppercase tracking-widest hover:bg-primary-hover disabled:opacity-50 transition-all">
              {updateMutation.isPending ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}


// ─── Shared Form Components ─────────────────────────────────────────────────

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
