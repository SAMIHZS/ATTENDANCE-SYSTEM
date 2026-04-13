import type { Request, Response, NextFunction } from 'express';
import type { AuthPayload, UserRole } from '../types';
import { supabaseAdmin } from '../lib/supabase';

// Extend Express Request to carry auth payload
declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches `req.auth` with the user's id, email, and role.
 * Responds 401 if token is missing or invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  console.log(`[Middleware] Auth Check: ${req.method} ${req.path}`);

  if (!header?.startsWith('Bearer ')) {
    console.warn('[Middleware] Missing Authorization header');
    res.status(401).json({ success: false, message: 'Missing authorization token.' });
    return;
  }

  const token = header.slice(7);
  console.log(`[Middleware] Verifying token (len: ${token.length})...`);

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('[Middleware] Supabase Auth Error:', error.message);
      res.status(401).json({ success: false, message: `Invalid token: ${error.message}` });
      return;
    }

    if (!user) {
      console.warn('[Middleware] No user returned for token');
      res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      return;
    }

    console.log(`[Middleware] User authenticated: ${user.email} (${user.id})`);

    // Fetch role from profiles (source of truth)
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      console.error('[Middleware] Profile missing for user:', user.email);
       res.status(403).json({ 
        success: false, 
        message: 'Account level access denied: Profile not found. Please contact admin.' 
      });
      return;
    }

    req.auth = {
      sub: user.id,
      email: user.email ?? '',
      role: profile.role as UserRole,
      profileId: user.id,
    };

    // Check if user is active (students and teachers can be deactivated)
    if (['student', 'teacher'].includes(profile.role)) {
      const tableName = profile.role === 'student' ? 'students' : 'teachers';
      const { data: record, error: recordErr } = await supabaseAdmin
        .from(tableName)
        .select('is_active')
        .eq('profile_id', user.id)
        .single();

      if (recordErr || !record) {
        console.warn(`[Middleware] ${profile.role} record not found for user:`, user.email);
        res.status(403).json({ 
          success: false, 
          message: `${profile.role} record not found. Please contact admin.` 
        });
        return;
      }

      if (!record.is_active) {
        console.warn(`[Middleware] ${profile.role} account is deactivated:`, user.email);
        res.status(403).json({ 
          success: false, 
          message: `Your ${profile.role} account has been deactivated. Please contact admin.` 
        });
        return;
      }
    }

    console.log(`[Middleware] Auth Success. Role: ${req.auth.role}`);
    next();
  } catch (err: any) {
    console.error('[Middleware] Unexpected Auth Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal auth error.' });
  }
}

/**
 * Role-gating middleware. Must be used after `requireAuth`.
 * Usage: router.get('/admin-only', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${roles.join(' or ')}.`,
      });
      return;
    }
    next();
  };
}
