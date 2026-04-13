import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextValue, AuthUser, Role } from '../types';
import { supabase } from '../lib/supabase';

const AuthContext = createContext<AuthContextValue | null>(null);

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
      console.log('[Auth] Auth state changed:', _event);
      if (session) {
        await fetchProfile(session);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  async function fetchProfile(providedSession?: any) {
    if (isFetchingProfile) {
      console.log('[Auth] Already fetching profile, skipping.');
      return;
    }

    console.log('[Auth] fetchProfile starting...');
    setIsFetchingProfile(true);
    
    try {
      let session = providedSession;
      if (!session) {
        console.log('[Auth] No session provided, checking getSession()...');
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }

      if (!session) {
        console.warn('[Auth] No session available.');
        setUser(null);
        return;
      }

      console.log('[Auth] Calling /api/v1/auth/me for:', session.user.email);
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        const text = await res.text();
        console.error(`[Auth] /me failed [${res.status}]:`, text);
        return;
      }

      const result = await res.json();
      if (result.success) {
        console.log('[Auth] Profile OK:', result.data.role);
        setUser({
          id: result.data.id,
          name: result.data.full_name,
          email: session.user.email ?? '',
          role: result.data.role,
          isBound: result.data.isBound
        });
      } else {
        console.error('[Auth] /me returned error:', result.message);
      }
    } catch (err) {
      console.error('[Auth] fetchProfile exception:', err);
    } finally {
      console.log('[Auth] fetchProfile finished.');
      setIsFetchingProfile(false);
      setIsLoading(false);
    }
  }

  const login = async (email: string, password: string, selectedRole?: Role) => {
    console.log('[Auth] login starting for', email);
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, selectedRole })
    });

    const result = await res.json();
    if (!result.success) {
      console.error('[Auth] login failed:', result.message);
      throw new Error(result.message);
    }

    if (result.data?.session) {
        console.log('[Auth] Setting Supabase session...');
        const { error } = await supabase.auth.setSession(result.data.session);
        if (error) {
          console.error('[Auth] setSession error:', error.message);
          throw error;
        }
        // Explicitly fetch profile with the session we just got
        return fetchProfile(result.data.session);
    }
    
    return fetchProfile();
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
