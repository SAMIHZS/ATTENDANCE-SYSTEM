import { useState, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import type { Role } from '../types';

export function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('student');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName, role: selectedRole });
        setError(null);
        alert('Registration successful! Please sign in with your new credentials.');
        setIsRegister(false);
      } else {
        await login(email, password, selectedRole);
        navigate(from ?? '/', { replace: true });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err.response?.data?.message || err.message || 'Action failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-0 w-1/2 h-2/3 bg-primary-container opacity-5" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 0% 100%)' }} />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-surface-container-low" />
      </div>

      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white mb-6 shadow-xl">
            <span className="material-symbols-outlined text-3xl">menu_book</span>
          </div>
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface mb-2">
            Attendance Ledger
          </h1>
          <p className="font-body text-on-surface-variant text-sm">Secure Institutional Access</p>
        </header>

        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant/10">
          {/* Tab Switcher */}
          <div className="flex bg-surface-container-high p-1 rounded-2xl mb-8">
            <button 
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!isRegister ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isRegister ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-error-container text-on-error-container text-sm animate-in fade-in slide-in-from-top-2" role="alert">
                <span className="material-symbols-outlined text-base mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Access Role</label>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${selectedRole === 'student' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline text-on-surface-variant'}`}
                 >
                   <span className="material-symbols-outlined text-xl">school</span>
                   <span className="text-sm font-bold">Student</span>
                 </button>
                 <button 
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${selectedRole === 'teacher' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:border-outline text-on-surface-variant'}`}
                 >
                   <span className="material-symbols-outlined text-xl">person</span>
                   <span className="text-sm font-bold">Teacher</span>
                 </button>
              </div>
            </div>

            {isRegister && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                <label htmlFor={nameId} className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
                <div className="relative">
                   <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">badge</span>
                   <input
                    id={nameId}
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-14 pl-12 pr-4 bg-surface rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                   />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor={emailId} className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">mail</span>
                <input
                  id={emailId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full h-14 pl-12 pr-4 bg-surface rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor={passwordId} className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">lock</span>
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 bg-surface rounded-2xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full h-14 bg-primary text-white rounded-2xl font-bold tracking-tight shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? 'Creating Account...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
                </>
              )}
            </button>
          </form>

          {!isRegister && (
            <div className="mt-8 pt-8 border-t border-outline-variant/30 flex flex-col items-center">
              <span className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-6">Or continue with</span>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-surface border border-outline-variant text-on-surface text-sm font-bold flex items-center justify-center gap-3 hover:bg-surface-container transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>
            </div>
          )}
        </div>

        <footer className="mt-10 text-center">
            <p className="text-xs text-on-surface-variant font-medium">
              Need help? <a href="#" className="text-primary font-bold underline underline-offset-4 decoration-primary/20">Support Portal</a>
            </p>
        </footer>
      </main>
    </>
  );
}
