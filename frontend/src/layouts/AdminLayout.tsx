import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const DESKTOP_NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/classes', label: 'Classes' },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/timetable', label: 'Timetable' },
  { to: '/admin/attendance', label: 'Explorer' },
  { to: '/admin/reports', label: 'Reports' },
];

const MOBILE_NAV = [
  { to: '/admin', icon: 'dashboard', label: 'Dash' },
  { to: '/admin/timetable', icon: 'calendar_today', label: 'Schedule' },
  { to: '/admin/attendance', icon: 'fact_check', label: 'Explorer' },
  { to: '/admin/reports', icon: 'analytics', label: 'Reports' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-0">
      {/* Top App Bar */}
      <header className="top-app-bar shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-fixed overflow-hidden flex items-center justify-center font-headline font-bold text-primary-container">
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <h1 className="text-xl font-headline font-black text-white tracking-tight">
            Admin Panel
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {/* Desktop inline nav */}
          <nav className="hidden md:flex gap-8 items-center">
            {DESKTOP_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  isActive
                    ? 'text-tertiary-fixed font-medium font-headline text-sm tracking-wide'
                    : 'text-slate-400 hover:opacity-80 transition-opacity font-medium font-headline text-sm tracking-wide'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="pt-16 max-w-7xl mx-auto px-4 md:px-8">
        <Outlet />
      </main>

      {/* Mobile-only Bottom Navigation */}
      <nav className="md:hidden bottom-nav">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              isActive
                ? 'flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl px-4 py-2 transition-all'
                : 'flex flex-col items-center justify-center text-slate-500 px-4 py-2 hover:bg-slate-100 transition-all active:scale-90'
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-[10px] font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
