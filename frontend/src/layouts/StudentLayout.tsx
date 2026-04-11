import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-surface pb-24">
      {/* Top App Bar */}
      <header className="top-app-bar shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center font-headline font-bold text-primary-container text-sm">
            {user?.name?.charAt(0).toUpperCase() ?? 'S'}
          </div>
          <span className="text-white font-headline tracking-tight font-bold text-base">
            Welcome, {user?.name?.split(' ')[0] ?? 'Student'}
          </span>
        </div>
        <div className="flex items-center gap-4">
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
      <main className="max-w-2xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/student'}
            className={({ isActive }) =>
              isActive
                ? 'flex flex-col items-center justify-center bg-slate-900 text-white rounded-xl px-4 py-2 transition-all'
                : 'flex flex-col items-center justify-center text-slate-500 px-4 py-2 hover:bg-slate-100 transition-all active:scale-90 duration-200'
            }
          >
            <span className="material-symbols-outlined mb-1">{item.icon}</span>
            <span className="font-label text-[10px] font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
