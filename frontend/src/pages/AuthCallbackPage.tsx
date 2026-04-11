import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * OAuth Callback Page
 * Supabase redirects here after Google OAuth completes.
 * The URL hash contains the access token — Supabase JS SDK handles it
 * automatically via detectSessionInUrl=true, which fires onAuthStateChange.
 * We just need to wait and then redirect to the role home.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Exchange the code in the URL for a session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        // Something went wrong — send back to login with error hint
        navigate('/login?error=oauth_failed', { replace: true });
        return;
      }
      // Navigate to root → RoleRedirect handles the role-based push
      navigate('/', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-surface">
      {/* Animated logo */}
      <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center shadow-xl animate-pulse-slow">
        <span className="material-symbols-outlined text-white text-3xl">menu_book</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
          <p className="font-headline font-bold text-on-surface text-lg">Signing you in…</p>
        </div>
        <p className="font-body text-sm text-on-surface-variant">
          Verifying your Google account
        </p>
      </div>
    </div>
  );
}
