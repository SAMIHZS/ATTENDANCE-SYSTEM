import { EmptyState } from '../../components/ui';

export * from './StudentDashboardPage';
export * from './StudentHistoryPage';
export * from './StudentSetupPage';

export function StudentSubjectsPage() {
  return (
    <div className="pt-24 px-6">
      <EmptyState icon="book" title="My Subjects" description="Subject-wise breakdown of your attendance." />
    </div>
  );
}

export function StudentProfilePage() {
  return (
    <div className="pt-24 px-6">
      <EmptyState icon="person" title="Profile" description="Your account details." />
    </div>
  );
}
