import 'dotenv/config';
import { sessionsService } from '../src/services/sessionsService';
import { supabaseAdmin } from '../src/lib/supabase';

async function verifySessionProtection() {
  console.log('🚀 Starting Session Protection Verification...\n');

  try {
    // 1. Setup a test submitted session
    console.log('--- Phase 1: Setup Test Session ---');
    const { data: testClass } = await supabaseAdmin.from('classes').select('id').limit(1).single();
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id').eq('role', 'teacher').limit(1);
    const { data: teachers } = await supabaseAdmin.from('teachers').select('id').eq('profile_id', profiles?.[0]?.id).limit(1).single();
    const { data: testSubject } = await supabaseAdmin.from('subjects').select('id').limit(1).single();

    if (!testClass || !teachers || !testSubject) {
      throw new Error('Pre-requisite data missing (class, teacher, or subject)');
    }

    const testTeacherId = teachers.id;
    const testDate = '2099-01-01'; // Future date to avoid clashes
    const testStartTime = '09:00';
    const testEndTime = '10:00';

    // Ensure clean state
    await supabaseAdmin.from('sessions')
      .delete()
      .match({ class_id: testClass.id, date: testDate, start_time: testStartTime });

    // Create a submitted session
    const session = await sessionsService.startSession({
      teacher_id: testTeacherId,
      class_id: testClass.id,
      date: testDate,
      start_time: testStartTime,
      end_time: testEndTime,
      subject_id: testSubject.id,
    });

    console.log('✅ Draft session created.');

    // Manually submit it
    const submitted = await sessionsService.submitSession(session.id, testTeacherId);
    console.log('✅ Session submitted (locked).');

    // 2. Try to "start" it again
    console.log('\n--- Phase 2: Overwrite Attempt ---');
    const result = await sessionsService.startSession({
      teacher_id: testTeacherId,
      class_id: testClass.id,
      date: testDate,
      start_time: testStartTime,
      end_time: testEndTime,
      subject_id: testSubject.id,
    });

    if (result.status === 'submitted') {
      console.log('✅ SUCCESS: Service returned the submitted session without resetting to draft.');
    } else {
      console.error('❌ FAILURE: Service reset the session to: ' + result.status);
    }

    // 3. Verify DB Constraint
    console.log('\n--- Phase 3: DB Constraint Check ---');
    const { error: dbError } = await supabaseAdmin.from('sessions').insert({
      class_id: testClass.id,
      date: testDate,
      start_time: testStartTime,
      end_time: testEndTime,
      actual_subject_id: testSubject.id,
      scheduled_subject_id: testSubject.id,
      actual_teacher_id: testTeacherId,
      scheduled_teacher_id: testTeacherId,
      status: 'draft'
    });

    if (dbError && dbError.code === '23505') {
       console.log('✅ SUCCESS: Database unique constraint correctly blocked duplicate insertion.');
    } else {
       console.error('❌ FAILURE: Database allowed duplicate insertion or returned unexpected error: ', dbError);
    }

    // Cleanup
    await supabaseAdmin.from('sessions').delete().eq('id', session.id);
    console.log('\n️🧹 Cleanup complete.');

  } catch (err: any) {
    console.error('\n🔴 Verification failed with error:', err.message);
  }
}

verifySessionProtection();
