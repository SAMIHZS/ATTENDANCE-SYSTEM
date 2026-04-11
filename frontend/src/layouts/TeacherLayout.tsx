import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/teacher', icon: 'dashboard', label: 'Dashboard' },
  { to: '/teacher/history', icon: 'fact_check', label: 'History' },
  { to: '/teacher/timetable', icon: 'calendar_today', label: 'Timetable' },
  { to: '/teacher/profile', icon: 'person', label: 'Profile' },
];

export function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top App Bar */}
      <header className="top-app-bar shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-headline font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() ?? 'T'}
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 font-label text-[10px] tracking-wider uppercase">
              Welcome Back
            </span>
            <span className="text-white font-headline font-bold tracking-tight text-base leading-tight">
              {user?.name ?? 'Teacher'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white transition-colors"
          title="Sign out"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>

      {/* Page Content */}
      <main className="max-w-2xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/teacher'}
            className={({ isActive }) =>
              isActive
                ? 'flex flex-col items-center justify-center bg-primary-container text-white rounded-xl px-4 py-2 transition-all'
                : 'flex flex-col items-center justify-center text-slate-500 px-4 py-2 hover:bg-slate-100 transition-all active:scale-90 duration-200'
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label text-[10px] font-medium tracking-wide mt-0.5">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
