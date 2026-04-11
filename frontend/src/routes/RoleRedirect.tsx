import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { Role } from '../types';

const ROLE_HOME: Record<Role, string> = {
  admin: '/admin',
  teacher: '/teacher',
  student: '/student',
};

/** Redirect authenticated users to their role home */
export function RoleRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={ROLE_HOME[user.role]} replace />;
}
