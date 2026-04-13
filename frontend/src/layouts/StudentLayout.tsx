import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const NAV_ITEMS = [
  { to: '/student', icon: 'dashboard', label: 'Dashboard' },
  { to: '/student/history', icon: 'analytics', label: 'My Stats' },
  { to: '/student/subjects', icon: 'book', label: 'Subjects' },
  { to: '/student/profile', icon: 'person', label: 'Profile' },
];

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="role-student min-h-screen bg-background text-on-background pb-24 font-body">
      {/* Top App Bar (Simplified Linear Style) */}
      <header className="top-app-bar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-role bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-primary font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase() ?? 'S'}
          </div>
          <span className="text-on-surface font-headline font-signature text-sm tracking-tight">
            {user?.name?.split(' ')[0] ?? 'Student'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="w-8 h-8 flex items-center justify-center rounded-role bg-white/[0.02] border border-white/[0.05] text-on-surface-variant hover:text-on-surface transition-all"
            title="Sign out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-xl mx-auto px-4">
        <Outlet />
      </main>

      {/* Bottom Navigation (Simplified Linear) */}
      <nav className="bottom-nav px-6 !pb-6">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/student'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-role ${
                isActive
                  ? 'text-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/[0.02]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="font-label text-[10px] font-medium tracking-tighter mt-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
