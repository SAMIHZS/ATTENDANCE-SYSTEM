import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="role-admin min-h-screen bg-background text-on-background pb-24 md:pb-0 font-body">
      {/* Top App Bar (IBM Carbon Style: Flat, high-contrast, sharp) */}
      <header className="top-app-bar !border-b-outline h-12">
        <div className="flex items-center gap-0">
          <div className="w-12 h-12 flex items-center justify-center bg-primary text-white">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </div>
          <h1 className="px-4 text-sm font-headline font-bold uppercase tracking-widest border-r border-outline-subtle h-12 flex items-center">
            System Admin
          </h1>
        </div>
        <div className="flex items-center gap-0 h-full">
          {/* Desktop inline nav (Carbon tabs style) */}
          <nav className="hidden md:flex items-center h-full">
            {DESKTOP_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `px-6 h-full flex items-center text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-primary bg-surface-low text-primary'
                      : 'border-transparent text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center text-on-surface-variant hover:bg-surface-low hover:text-on-surface transition-colors"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="pt-12 max-w-[1600px] mx-auto p-6 md:p-8">
        <Outlet />
      </main>

      {/* Mobile-only Bottom Navigation (Airtable Style: Pill selected states) */}
      <nav className="md:hidden bottom-nav !h-16">
        {MOBILE_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant'
              }`
            }
          >
            <div className={`w-12 h-8 flex items-center justify-center rounded-full transition-colors ${
              (location.pathname === item.to || (item.to === '/admin' && location.pathname === '/admin')) 
                ? 'bg-primary/10' 
                : ''
            }`}>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            </div>
            <span className="font-label text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
