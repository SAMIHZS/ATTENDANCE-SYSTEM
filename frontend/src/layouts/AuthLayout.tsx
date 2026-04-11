import { Outlet } from 'react-router-dom';

/** Minimal centered layout for login/auth screens */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 sm:p-8">
      <Outlet />
    </div>
  );
}
