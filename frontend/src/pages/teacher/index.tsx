import { EmptyState } from '../../components/ui';

export * from './TeacherDashboardPage';
export * from './TeacherHistoryPage';
export * from './TeacherRollCallPage';

// ── Future Work: Teacher Timetable View ──────────────────────────────────────
// Planned: Show the teacher's weekly timetable grid with class/subject slots.
export function TeacherTimetablePage() {
  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto">
      <EmptyState icon="calendar_month" title="My Timetable" description="Your weekly teaching schedule will appear here. Not implemented yet." />
    </div>
  );
}

// ── Future Work: Teacher Profile Page ────────────────────────────────────────
// Planned: Show account details, department, employee ID, and password change.
export function TeacherProfilePage() {
  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto">
      <EmptyState icon="person" title="My Profile" description="Your account and department details will appear here. Not implemented yet." />
    </div>
  );
}
