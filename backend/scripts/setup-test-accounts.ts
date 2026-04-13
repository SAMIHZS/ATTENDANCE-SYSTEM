import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or SUPABASE_SERVICE_ROLE_KEY is not configured');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_USERS = [
  { email: 'admin@example.com', password: 'password123', full_name: 'Test Admin', role: 'admin' },
  { email: 'teacher@example.com', password: 'password123', full_name: 'Test Teacher', role: 'teacher' },
  { email: 'student@example.com', password: 'password123', full_name: 'Test Student', role: 'student' }
];

async function setup() {
  console.log('🚀 Setting up Golden Test Accounts...');

  // 1. Clear existing test users to ensure a clean start
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  const existingTestUsers = usersData.users.filter(u => 
    TEST_USERS.some(tu => tu.email === u.email)
  );

  if (existingTestUsers.length > 0) {
    console.log(`➜ Clearing ${existingTestUsers.length} existing test accounts...`);
    for (const u of existingTestUsers) {
      await supabaseAdmin.auth.admin.deleteUser(u.id);
      // Also delete from profiles to be sure
      await supabaseAdmin.from('profiles').delete().eq('id', u.id);
    }
  }

  for (const user of TEST_USERS) {
    console.log(`➜ Creating ${user.email}...`);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role }
    });

    if (authError) {
      console.error(`  - Failed to create ${user.email}:`, authError.message);
      continue;
    }
    
    const userId = authData.user!.id;
    console.log(`  - Auth user created: ${userId}`);

    // 2. Upsert Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name: user.full_name,
      role: user.role
    });

    if (profileError) {
      console.error(`  - Profile insert error:`, profileError.message);
      continue;
    }
    console.log(`  - Profile synced.`);

    // 3. Role Specific setup
    if (user.role === 'teacher') {
      const { error: tErr } = await supabaseAdmin.from('teachers').upsert({
        profile_id: userId,
        employee_id: `T-${user.email.split('@')[0].toUpperCase()}`,
        department: 'Testing'
      }, { onConflict: 'profile_id' });
      if (tErr) console.error(`  - Teacher record error:`, tErr.message);
      else console.log(`  - Teacher record ensured.`);
    } else if (user.role === 'student') {
      const { data: bca4 } = await supabaseAdmin.from('classes').select('id').eq('name', 'BCA 4th Semester').single();
      if (bca4) {
        const { error: sErr } = await supabaseAdmin.from('students').upsert({
          profile_id: userId,
          class_id: bca4.id,
          roll_number: `S-${user.email.split('@')[0].toUpperCase()}`
        }, { onConflict: 'profile_id' });
        if (sErr) console.error(`  - Student record error:`, sErr.message);
        else console.log(`  - Student record (BCA4) ensured.`);
      }
    }
  }

  console.log('✅ Setup complete!');
}

setup().catch(console.error);
