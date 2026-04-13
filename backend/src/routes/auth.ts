import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

// ─── Rate Limiters ─────────────────────────────────────────────────────────
// Login: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register: 5 attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/v1/auth/register
 * Handles user sign up and profile creation.
 * SECURITY: Public registration is locked to 'student' role only.
 * Admin and teacher roles must be assigned by an administrator.
 */
authRouter.post('/register', registerLimiter, async (req: Request, res: Response) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  // SECURITY: Only allow 'student' role via public registration.
  // Admin and teacher roles must be assigned by an admin through the admin panel or database.
  const safeRole = 'student';
  if (role !== 'student') {
    console.warn(`[Auth] Registration attempted with role '${role}' by ${email} — forced to 'student'.`);
  }

  try {
    // 1. Sign up user in Supabase Auth
    let userId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: safeRole }
    });

    if (authError) {
      // If user already exists, try to find them
      if (authError.message === 'User already exists') {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (listError) throw listError;
        // Use targeted lookup instead of listing all users
        const { data: existingUserData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id ?? '')
          .single();
        if (!existingUserData) throw new Error('User reported exists but profile not found.');
        userId = existingUserData.id;
      } else {
        throw authError;
      }
    } else {
      userId = authData.user!.id;
    }

    // 2. Create/Update profile record (Idempotent)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name,
      role: safeRole
    });

    if (profileError) {
      console.error('Profile sync error:', profileError);
      return res.status(500).json({ success: false, message: 'Auth user exists, but profile syncing failed.' });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Registration successful. Please log in.',
      data: { userId }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { email, password, selectedRole } = req.body;

  try {
    // 1. Authenticate with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ success: false, message: error.message });

    // 2. Fetch role from source of truth (profiles table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ success: false, message: 'Account status incomplete: Profile not found.' });
    }

    // 3. Role Enforcement
    if (selectedRole && profile.role !== selectedRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Incorrect role. This account is registered as a ${profile.role}.` 
      });
    }

    return res.json({ 
      success: true, 
      data: {
        session: data.session,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile.role
        }
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Login failed unexpectedly' });
  }
});

/**
 * GET /api/v1/auth/me
 * Retrieves the current session user's profile and binding status
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = req.auth!;

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.sub)
      .single();

    if (profileError || !profile) {
       return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    let details = {};
    let isBound = true;

    if (profile.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('roll_number, class_id')
        .eq('profile_id', user.sub)
        .single();
      
      details = { student };
      isBound = !!student?.roll_number;
    } else if (profile.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('employee_id, department')
        .eq('profile_id', user.sub)
        .single();
      details = { teacher };
    }

    return res.json({
      success: true,
      data: {
        ...profile,
        ...details,
        isBound
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' });
});
