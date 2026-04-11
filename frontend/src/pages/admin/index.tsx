export { AdminDashboardPage } from './AdminDashboardPage';
export { AdminReportsPage } from './AdminReportsPage';
export { AdminAttendancePage } from './AdminAttendancePage';
export { AdminClassesPage } from './AdminClassesPage';
export { AdminSubjectsPage } from './AdminSubjectsPage';
export { AdminTimetablePage } from './AdminTimetablePage';

import { EmptyState } from '../../components/ui';

export function AdminUsersPage() {
  return (
    <div className="pt-8">
      <EmptyState icon="group" title="User Management" description="Manage students and teachers. [Coming soon]" />
    </div>
  );
}
