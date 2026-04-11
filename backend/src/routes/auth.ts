import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

/**
 * POST /api/v1/auth/register
 * Handles user sign up and profile creation
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user.');

    // 2. Create profile record in public.profiles using admin client to bypass RLS
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      full_name,
      role
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(500).json({ success: false, message: 'User created but profile setup failed.' });
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Registration successful. Please log in.',
      data: { userId: authData.user.id }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/v1/auth/login
 * Validates credentials and enforces the selected role
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password, selectedRole } = req.body;

  try {
    // 1. Authenticate with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // 2. Fetch role from source of truth (profiles table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ success: false, message: 'User profile not found.' });
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
    return res.status(500).json({ success: false, message: error.message });
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
