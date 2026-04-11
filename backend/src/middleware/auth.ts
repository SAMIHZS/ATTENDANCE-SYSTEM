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
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing authorization token.' });
    return;
  }

  const token = header.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    return;
  }

  // Fetch role from profiles (source of truth)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  req.auth = {
    sub: user.id,
    email: user.email ?? '',
    role: (profile?.role ?? 'student') as UserRole,
    profileId: user.id,
  };

  next();
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
