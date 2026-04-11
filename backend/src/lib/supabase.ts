import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
}

/**
 * Admin client (service role) — bypasses RLS.
 * Used for server-side operations that need elevated privileges.
 * Falls back to anon key if service role key is not set (read-only/RLS-filtered).
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Create a user-scoped Supabase client from a JWT.
 * RLS policies apply — safe for user-specific queries.
 */
export function supabaseWithJwt(jwt: string) {
  return createClient(supabaseUrl!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}
