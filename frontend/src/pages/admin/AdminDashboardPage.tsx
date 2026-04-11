import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.getDashboard,
    staleTime: 60 * 1000 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="pt-24 px-6 flex justify-center">
        <span className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto pb-32">
      <h2 className="font-headline font-extrabold text-3xl text-primary mb-8 tracking-tight">
        Institution Health
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            groups
          </span>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1 text-center">Total Students</p>
          <p className="font-headline text-3xl font-extrabold text-primary">{stats?.totalStudents || 0}</p>
        </div>

        <div className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1 text-center">Total Teachers</p>
          <p className="font-headline text-3xl font-extrabold text-primary">{stats?.totalTeachers || 0}</p>
        </div>

        <div className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-tertiary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            class
          </span>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1 text-center">Active Classes</p>
          <p className="font-headline text-3xl font-extrabold text-primary">{stats?.totalClasses || 0}</p>
        </div>

        <div className="bg-surface-container-low p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-error mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
            event_available
          </span>
          <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1 text-center">Today's Sessions</p>
          <p className="font-headline text-3xl font-extrabold text-primary">{stats?.todaySessions || 0}</p>
        </div>
      </div>

      <div className="bg-surface-container-low p-6 mt-6 rounded-[2rem] flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <span className="material-symbols-outlined text-4xl text-primary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
          monitoring
        </span>
        <p className="font-label text-sm text-on-surface-variant uppercase tracking-widest font-bold mb-1">Avg Institutional Attendance</p>
        <p className="font-headline text-5xl font-extrabold text-primary">{stats?.averageAttendance || 0}%</p>
      </div>

      <h3 className="font-headline font-bold text-xl text-primary mt-12 mb-6">Quick Links</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: 'class', label: 'Manage Classes', to: '/admin/classes' },
          { icon: 'book', label: 'Manage Subjects', to: '/admin/subjects' },
          { icon: 'person_add', label: 'Manage Teachers', to: '/admin/users' },
          { icon: 'person_add', label: 'Manage Students', to: '/admin/users' },
          { icon: 'calendar_today', label: 'Timetable Manager', to: '/admin/timetable' },
          { icon: 'fact_check', label: 'Attendance Explorer', to: '/admin/attendance' },
        ].map((link, idx) => (
          <Link key={idx} to={link.to} className="bg-surface-container-low hover:bg-surface-container p-4 rounded-2xl flex items-center gap-3 transition-colors">
             <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>{link.icon}</span>
             <span className="font-label text-xs uppercase tracking-widest font-bold">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
