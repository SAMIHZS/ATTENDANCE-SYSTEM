import { EmptyState } from '../../components/ui';

export * from './StudentDashboardPage';
export * from './StudentHistoryPage';
export * from './StudentSetupPage';

// ── Future Work: Student Subjects Page ───────────────────────────────────────
// Planned: Subject-wise attendance cards with teacher info and percentage badges.
export function StudentSubjectsPage() {
  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto">
      <EmptyState icon="book" title="My Subjects" description="Subject-wise breakdown of your attendance will appear here. Not implemented yet." />
    </div>
  );
}

// ── Future Work: Student Profile Page ────────────────────────────────────────
// Planned: Account details, roll number, class info, and password change.
export function StudentProfilePage() {
  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto">
      <EmptyState icon="person" title="My Profile" description="Your account and enrollment details will appear here. Not implemented yet." />
    </div>
  );
}
