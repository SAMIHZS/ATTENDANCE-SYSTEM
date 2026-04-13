import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.getDashboard,
    staleTime: 60 * 1000 * 5, // 5 minutes
  });

  // Fetch pending teacher requests
  const { data: teacherRequests } = useQuery({
    queryKey: ['admin', 'teacher-requests'],
    queryFn: async () => {
      const res = await adminApi.getPendingTeacherRequests();
      return res;
    },
    staleTime: 30 * 1000, // 30 seconds, they change frequently
  });

  if (isLoading) {
    return (
      <div className="pt-24 px-6 flex justify-center">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  const pendingRequestsCount = teacherRequests?.length || 0;

  return (
    <div className="space-y-8 animate-in pb-32">
      {/* Carbon Style Header */}
      <div className="border-b border-outline-subtle pb-6">
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight uppercase">
          Institutional Overview
        </h2>
        <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-[0.2em] font-bold opacity-60">
          Real-time metrics & system health
        </p>
      </div>

      {/* High-Density Metric Grid (Carbon Style) */}
      <div className="grid grid-cols-1 md:grid-cols-5 border border-outline-subtle bg-surface-low overflow-hidden">
        <div className="p-8 border-r border-outline-subtle flex flex-col justify-between h-40">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold">Total Students</p>
          <div className="flex items-end justify-between">
            <p className="font-headline text-4xl font-bold text-on-surface">{stats?.totalStudents || 0}</p>
            <span className="material-symbols-outlined text-secondary opacity-40 text-4xl">groups</span>
          </div>
        </div>

        <div className="p-8 border-r border-outline-subtle flex flex-col justify-between h-40">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold">Active Staff</p>
          <div className="flex items-end justify-between">
            <p className="font-headline text-4xl font-bold text-on-surface">{stats?.totalTeachers || 0}</p>
            <span className="material-symbols-outlined text-secondary opacity-40 text-4xl">person</span>
          </div>
        </div>

        <div className="p-8 border-r border-outline-subtle flex flex-col justify-between h-40">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold">Registered Classes</p>
          <div className="flex items-end justify-between">
            <p className="font-headline text-4xl font-bold text-on-surface">{stats?.totalClasses || 0}</p>
            <span className="material-symbols-outlined text-primary opacity-40 text-4xl">class</span>
          </div>
        </div>

        <div className="p-8 border-r border-outline-subtle flex flex-col justify-between h-40">
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold">Today's Sessions</p>
          <div className="flex items-end justify-between">
            <p className="font-headline text-4xl font-bold text-on-surface">{stats?.todaySessions || 0}</p>
            <span className="material-symbols-outlined text-error opacity-40 text-4xl">event_available</span>
          </div>
        </div>

        <Link to="/admin/teacher-requests" className={`p-8 flex flex-col justify-between h-40 ${ pendingRequestsCount > 0 ? 'bg-warning-container/20 border-l-4 border-warning' : '' } hover:bg-surface-container-low transition-colors`}>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold">Pending Requests</p>
          <div className="flex items-end justify-between">
            <p className={`font-headline text-4xl font-bold ${pendingRequestsCount > 0 ? 'text-warning' : 'text-on-surface'}`}>{pendingRequestsCount}</p>
            <span className="material-symbols-outlined opacity-40 text-4xl">notification_important</span>
          </div>
        </Link>
      </div>

      <div className="bg-white border border-outline-subtle p-12 flex flex-col items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-primary transform origin-left scale-x-[0.85]" />
        <p className="font-label text-xs text-on-surface-variant uppercase tracking-[0.3em] font-bold mb-4 opacity-70">Average Institutional Attendance</p>
        <p className="font-headline text-7xl font-bold text-on-surface leading-none tabular-nums group-hover:text-primary transition-colors cursor-default">
          {stats?.averageAttendance || 0}<span className="text-4xl text-on-surface-variant font-light">%</span>
        </p>
      </div>

      <h3 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-on-surface-variant mt-12 mb-6">Administrative Control Panel</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-t border-l border-outline-subtle">
        {[
          { icon: 'domain', label: 'Batch Directory', description: 'Manage groups, years, and semester schedules.', to: '/admin/classes' },
          { icon: 'subject', label: 'Subject Catalog', description: 'Register subjects and assign credit systems.', to: '/admin/subjects' },
          { icon: 'manage_accounts', label: 'Faculty Management', description: 'Modify teacher authentication and roles.', to: '/admin/users?role=teacher' },
          { icon: 'badge', label: 'Student Nexus', description: 'Provision students and link roll numbers.', to: '/admin/users?role=student' },
          { icon: 'date_range', label: 'Timetable Matrix', description: 'Define session slots and global schedules.', to: '/admin/timetable' },
          { icon: 'analytics', label: 'Attendance Reports', description: 'Deep-dive reports and compliance data.', to: '/admin/attendance' },
        ].map((link, idx) => (
          <Link key={idx} to={link.to} className="bg-white hover:bg-surface-low border-r border-b border-outline-subtle p-8 transition-all group">
            <div className="flex items-center gap-4 mb-3">
              <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">{link.icon}</span>
              <span className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">{link.label}</span>
            </div>
            <p className="text-on-surface-variant text-[11px] leading-relaxed opacity-70 group-hover:opacity-100">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
