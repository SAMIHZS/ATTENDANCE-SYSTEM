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

const dayMap: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

async function run() {
  console.log('🚀 Setting up a Global Live Class for all Teachers...');

  const todayNum = new Date().getDay();
  const currentDayStr = dayMap[todayNum];

  if (currentDayStr === 'sunday') {
    console.log('Warning: It is Sunday. Timetable logic might not expect Sunday slots, but trying anyway...');
  }

  // 1. Get any Class
  const { data: firstClass } = await supabaseAdmin.from('classes').select('id, name').limit(1).single();
  if (!firstClass) throw new Error('No class found in DB. Run seed-bca4.ts first.');
  
  // 2. Get any Subject
  const { data: firstSubject } = await supabaseAdmin.from('subjects').select('id, name').limit(1).single();
  if (!firstSubject) throw new Error('No subject found in DB. Run seed-bca4.ts first.');

  // 3. Get all teachers
  const { data: teachers } = await supabaseAdmin.from('teachers').select('id, employee_id, profile:profiles(full_name)');
  
  if (!teachers || teachers.length === 0) {
     console.log('❌ No teachers found in the DB. Please create a teacher user first.');
     return;
  }

  console.log(`Found ${teachers.length} teachers. Injecting a continuous Live Class for today (${currentDayStr}).`);

  // 4. Clean up any existing ALL DAY slots we injected previously to avoid dup errors
  await supabaseAdmin
    .from('timetable')
    .delete()
    .eq('start_time', '00:00:00')
    .eq('end_time', '23:59:59');

  // 5. Inject
  for (const teacher of teachers) {
    console.log(`Injecting for: ${(teacher as any).profile?.full_name || 'Unknown'} (ID: ${teacher.id})`);
    
    // Create class subject mapping just in case
    await supabaseAdmin
      .from('class_subjects')
      .upsert({ class_id: firstClass.id, subject_id: firstSubject.id, teacher_id: teacher.id }, { onConflict: 'class_id,subject_id' })
      .select('id').single();

    // Create 24hr timetable slot for this specific day
    const { error: ttErr } = await supabaseAdmin
      .from('timetable')
      .insert({
        class_id: firstClass.id,
        subject_id: firstSubject.id,
        teacher_id: teacher.id,
        day_of_week: currentDayStr === 'sunday' ? 'monday' : currentDayStr, // Handle sunday if enum doesn't allow it
        start_time: '00:00',
        end_time: '23:59'
      });
      
    if (ttErr) {
       console.error(`Failed to inject for ${teacher.id}. Details:`, ttErr);
    }
  }

  console.log('✅ Done! All teachers now have a live class spanning today from 00:00 to 23:59.');
  console.log(`Log into any teacher account -> Go to Dashboard -> You should see "${firstSubject.name}" live right now.`);
}

run().catch(console.error);
