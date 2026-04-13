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
    <div className="role-teacher min-h-screen bg-background text-on-background pb-24 font-body">
      {/* Top App Bar (Linear Style: High-definition borders, luminous text) */}
      <header className="top-app-bar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-role bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-primary font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase() ?? 'T'}
          </div>
          <div className="flex flex-col">
            <span className="text-on-surface-variant font-label text-[10px] tracking-widest uppercase">
              Dashboard
            </span>
            <span className="text-on-surface font-headline font-signature text-sm tracking-tight leading-tight">
              {user?.name ?? 'Teacher'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center rounded-role bg-white/[0.02] border border-white/[0.05] text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05] transition-all"
          title="Sign out"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </header>

      {/* Page Content */}
      <main className="max-w-xl mx-auto px-4">
        <Outlet />
      </main>

      {/* Bottom Navigation (Linear Style: Minimalist, glassmorphic) */}
      <nav className="bottom-nav flex gap-1 px-4 !pb-6">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/teacher'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-role ${
                isActive
                  ? 'text-primary bg-white/[0.03] scale-100'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/[0.02] active:scale-95'
              }`
            }
          >
            <span className={`material-symbols-outlined text-[22px] ${item.icon === 'dashboard' ? 'font-variation-fill-1' : ''}`}>
              {item.icon}
            </span>
            <span className="font-label text-[10px] font-medium tracking-wide mt-1">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
