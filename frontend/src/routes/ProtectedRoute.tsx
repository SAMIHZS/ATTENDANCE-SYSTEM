import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-label text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. Roll Number Binding Check (for Students)
  if (user?.role === 'student' && !user.isBound && location.pathname !== '/student/setup') {
    return <Navigate to="/student/setup" replace />;
  }

  // 2. Role Gating
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate home for their role
    const roleHome: Record<Role, string> = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
    };
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
}
