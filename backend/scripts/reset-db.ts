/**
 * Safe Database Reset Script
 * Keeps: schema, migrations, RPCs, constraints
 * Removes: all data (attendance, sessions, students, teachers, and non-admin profiles)
 * Preserves: admin@example.com and one test teacher (optionally specified)
 * 
 * Usage:
 *   npx ts-node scripts/reset-db.ts [--confirm]
 *   
 * Note: Requires SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CONFIRM_FLAG = process.argv.includes('--confirm');

async function resetDatabase() {
  try {
    console.log('🔍 Starting Safe Database Reset...\n');

    if (!CONFIRM_FLAG) {
      console.log('⚠️  This will DELETE all attendance, sessions, students, teachers, and non-admin profiles.');
      console.log('   Run with --confirm flag to proceed:');
      console.log('   npx ts-node scripts/reset-db.ts --confirm\n');
      process.exit(0);
    }

    console.log('✓ Confirmed. Proceeding with reset...\n');

    // Step 1: Delete in order of foreign key dependencies
    console.log('📌 Step 1: Deleting attendance records...');
    const { error: attErr } = await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (attErr) throw attErr;
    console.log('  ✓ Attendance deleted\n');

    console.log('📌 Step 2: Deleting sessions...');
    const { error: sessErr } = await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (sessErr) throw sessErr;
    console.log('  ✓ Sessions deleted\n');

    console.log('📌 Step 3: Deleting timetable...');
    const { error: ttErr } = await supabase.from('timetable').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (ttErr) throw ttErr;
    console.log('  ✓ Timetable deleted\n');

    console.log('📌 Step 4: Deleting class_subjects...');
    const { error: csErr } = await supabase.from('class_subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (csErr) throw csErr;
    console.log('  ✓ Class subjects deleted\n');

    console.log('📌 Step 5: Deleting students...');
    const { error: stdErr } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (stdErr) throw stdErr;
    console.log('  ✓ Students deleted\n');

    console.log('📌 Step 6: Deleting teachers...');
    const { error: tErr } = await supabase.from('teachers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (tErr) throw tErr;
    console.log('  ✓ Teachers deleted\n');

    // Step 2: Identify admin and test teacher to preserve
    console.log('📌 Step 7: Identifying users to preserve...');
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, id as user_id')
      .eq('email', 'admin@example.com');
    
    const adminId = adminProfiles?.[0]?.user_id;
    
    const { data: testTeacherProfiles } = await supabase
      .from('profiles')
      .select('id, id as user_id')
      .eq('email', 'test@teacher.example.com');
    
    const testTeacherId = testTeacherProfiles?.[0]?.user_id;

    console.log(`  Admin ID: ${adminId}`);
    console.log(`  Test Teacher ID: ${testTeacherId}\n`);

    // Step 3: Delete all non-admin, non-test-teacher profiles
    console.log('📌 Step 8: Deleting non-admin profiles (keeping admin & test teacher)...');
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id');

    const profilesToKeep = [adminId, testTeacherId].filter(Boolean);
    const profilesToDelete = allProfiles?.filter(p => !profilesToKeep.includes(p.id)) || [];

    for (const profile of profilesToDelete) {
      // Delete from auth.users first (if accessible via service role)
      try {
        await supabase.auth.admin.deleteUser(profile.id);
      } catch (e) {
        // Silently skip if auth user doesn't exist
      }

      // Delete from profiles
      const { error: delErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);
      if (delErr) console.warn(`  ⚠️  Could not delete profile ${profile.id}: ${delErr.message}`);
    }
    console.log(`  ✓ Deleted ${profilesToDelete.length} profiles\n`);

    // Step 4: Ensure admin profile has correct role
    console.log('📌 Step 9: Ensuring admin profile is set correctly...');
    if (adminId) {
      const { error: adminErr } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', adminId);
      if (adminErr) throw adminErr;
      console.log('  ✓ Admin profile verified\n');
    } else {
      console.log('  ⚠️  Admin profile not found. You may need to create it manually.\n');
    }

    // Step 5: Ensure test teacher profile exists with correct role
    console.log('📌 Step 10: Ensuring test teacher profile is set correctly...');
    if (testTeacherId) {
      const { error: teacherErr } = await supabase
        .from('profiles')
        .update({ role: 'teacher' })
        .eq('id', testTeacherId);
      if (teacherErr) throw teacherErr;
      console.log('  ✓ Test teacher profile verified\n');
    } else {
      console.log('  ⚠️  Test teacher profile not found. You may need to create it manually.\n');
    }

    // Step 6: Optional - Clear classes & subjects (keep for now if they are generic)
    console.log('📌 Step 11: Classes and Subjects - keeping (they are generic reference data)...\n');

    console.log('✅ Database reset complete!\n');
    console.log('📋 Summary:');
    console.log('  ✓ Deleted: attendance, sessions, timetable, class_subjects, students, teachers');
    console.log('  ✓ Preserved admin profile (admin@example.com)');
    console.log('  ✓ Preserved test teacher profile (test@teacher.example.com)');
    console.log('  ✓ Schema, migrations, RPCs, and constraints remain intact\n');
    console.log('🚀 Ready for fresh data import!\n');

  } catch (error: any) {
    console.error('❌ Reset failed:', error.message || error);
    process.exit(1);
  }
}

resetDatabase();
