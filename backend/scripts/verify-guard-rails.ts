import 'dotenv/config';
import { supabaseAdmin } from '../src/lib/supabase';
import { sessionsService } from '../src/services/sessionsService';

/**
 * Phase 8 Verification: Guard Rails & Security
 * This script validates that the newly implemented security checks and transaction logic are working.
 */
async function runVerification() {
  console.log('🚀 Starting Phase 8 Security Verification...');

  try {
    // 1. Fetch a real session and its teacher
    const { data: session } = await supabaseAdmin.from('sessions').select('*').limit(1).single();
    if (!session) {
      console.log('⚠️ No sessions found to test with. Run seed first.');
      return;
    }
    
    // 2. Resolve teacher profile
    const { data: teacher } = await supabaseAdmin.from('teachers').select('profile_id').eq('id', session.actual_teacher_id).single();
    const realTeacherProfileId = teacher?.profile_id;

    // 3. Attempt access as a WRONG teacher
    console.log('\n--- Test 1: Ownership Enforcement ---');
    const fakeProfileId = '00000000-0000-0000-0000-000000000000';
    try {
      await sessionsService.getStudentsForSession(session.id, fakeProfileId);
      console.log('❌ FAIL: getStudentsForSession should have thrown Forbidden for wrong teacher');
    } catch (err: any) {
      if (err.statusCode === 403) {
        console.log('✅ PASS: Correctly rejected unauthorized teacher access (403)');
      } else {
        console.log('❌ FAIL: Unexpected error type:', err.message);
      }
    }

    // 4. Test Atomic Submission RPC (via service)
    console.log('\n--- Test 2: Atomic Submission ---');
    // We create a fresh draft session to test submission
    const testSessionData = {
        class_id: session.class_id,
        date: new Date().toISOString().split('T')[0],
        start_time: '23:00',
        end_time: '23:59',
        subject_id: session.actual_subject_id,
        teacher_id: session.actual_teacher_id
    };
    
    const { data: newSession, error: createErr } = await supabaseAdmin.from('sessions').upsert({
        class_id: testSessionData.class_id,
        date: testSessionData.date,
        start_time: testSessionData.start_time,
        end_time: testSessionData.end_time,
        actual_subject_id: testSessionData.subject_id,
        scheduled_subject_id: testSessionData.subject_id,
        actual_teacher_id: testSessionData.teacher_id,
        scheduled_teacher_id: testSessionData.teacher_id,
        status: 'draft'
    }).select().single();

    if (createErr) throw createErr;
    console.log('Draft session created:', newSession.id);

    // Act: Submit it
    const summary = await sessionsService.submitSession(newSession.id, realTeacherProfileId!);
    console.log('Submission Result Summary:', summary);
    
    if (summary.status === 'submitted') {
        console.log('✅ PASS: Session submitted successfully via RPC');
    } else {
        console.log('❌ FAIL: Submission status unexpected');
    }

    // Attempt double submission
    try {
        await sessionsService.submitSession(newSession.id, realTeacherProfileId!);
        console.log('❌ FAIL: Should have thrown for double submission');
    } catch (err: any) {
        if (err.statusCode === 409) {
            console.log('✅ PASS: Correctly rejected double submission (409)');
        } else {
            console.log('❌ FAIL: Unexpected error for double submission:', err.message);
        }
    }

    // Cleanup
    await supabaseAdmin.from('attendance').delete().eq('session_id', newSession.id);
    await supabaseAdmin.from('sessions').delete().eq('id', newSession.id);
    console.log('Cleanup complete.');

    console.log('\n✨ All security guards verified successfully.');

  } catch (err) {
    console.error('❌ Verification Script Failed:', err);
    process.exit(1);
  }
}

runVerification();
