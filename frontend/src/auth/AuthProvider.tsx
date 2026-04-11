import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextValue, AuthUser, Role } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextValue | null>(null);

// Map Supabase user metadata → our AuthUser shape
function toAuthUser(supabaseUser: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    name: (meta.full_name ?? meta.name ?? supabaseUser.email?.split('@')[0] ?? 'User') as string,
    email: supabaseUser.email ?? '',
    role: (meta.role ?? 'student') as Role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfile();
      } else {
        setIsLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchProfile();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      const result = await res.json();
      if (result.success) {
        setUser({
          id: result.data.id,
          name: result.data.full_name,
          email: '', // Not returned by /me for privacy, can fetch from session if needed
          role: result.data.role,
          isBound: result.data.isBound
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const login = async (email: string, password: string, selectedRole?: Role) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, selectedRole })
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    // If backend proxy logic didn't already sign in (it should have),
    // but in our current backend implementation it does sign in and returns the session.
    // We need to set the session in the client.
    if (result.data?.session) {
        const { error } = await supabase.auth.setSession(result.data.session);
        if (error) throw error;
    }
    
    await fetchProfile();
  };

  const register = async (data: any) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message);
    return result;
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
