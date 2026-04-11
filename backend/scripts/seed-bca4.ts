import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or SUPABASE_SERVICE_ROLE_KEY is not configured');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const CLASS_NAME = 'BCA 4th Semester';

// Define the subjects in the exact order of the PDF columns:
// Python(37), Python Lab(20), OS(39), OS Lab(24), Andriod(37), Andriod Lab(22),
// AI games(30), AI games Lab(24), AI systems(33), AI systems Lab(18), CS(20), FOE(18), CSP(10),
// Sports(30), Day(9), RTV(10), MID 1(15), MID 1 Lab(12)
const BCA4_SUBJECTS = [
  { name: 'Python', code: 'PY01', total: 37 },
  { name: 'Python Lab', code: 'PY01L', total: 20 },
  { name: 'OS', code: 'OS01', total: 39 },
  { name: 'OS Lab', code: 'OS01L', total: 24 },
  { name: 'Android', code: 'AND01', total: 37 },
  { name: 'Android Lab', code: 'AND01L', total: 22 },
  { name: 'AI Games', code: 'AIG01', total: 30 },
  { name: 'AI Games Lab', code: 'AIG01L', total: 24 },
  { name: 'AI Systems', code: 'AIS01', total: 33 },
  { name: 'AI Systems Lab', code: 'AIS01L', total: 18 },
  { name: 'CS', code: 'CS01', total: 20 },
  { name: 'FOE', code: 'FOE01', total: 18 },
  { name: 'CSP', code: 'CSP01', total: 10 },
  { name: 'Sports', code: 'SPT01', total: 30 },
  { name: 'Day Activity', code: 'DAY01', total: 9 },
  { name: 'RTV', code: 'RTV01', total: 10 },
  { name: 'MID 1', code: 'MID01', total: 15 },
  { name: 'MID 1 Lab', code: 'MID01L', total: 12 },
];

async function run() {
  console.log('🚀 Starting BCA4 Seeder...');

  // 1. Create the class
  console.log('➜ Ensuring Class exists...');
  let classId: string;
  const { data: existingClass } = await supabaseAdmin
    .from('classes')
    .select('id')
    .eq('name', CLASS_NAME)
    .single();

  if (existingClass) {
    classId = existingClass.id;
  } else {
    const { data: newClass, error: classErr } = await supabaseAdmin
      .from('classes')
      .insert({ name: CLASS_NAME })
      .select('id')
      .single();
    if (classErr) throw classErr;
    classId = newClass.id;
  }

  // 2. Create the subjects and retrieve their IDs.
  console.log('➜ Creating / fetching subjects...');
  const subjectIds: Record<string, string> = {};
  for (const subj of BCA4_SUBJECTS) {
    const { data: existingSubj } = await supabaseAdmin
      .from('subjects')
      .select('id')
      .eq('code', subj.code)
      .single();

    if (existingSubj) {
      subjectIds[subj.name] = existingSubj.id;
    } else {
      const { data: sData, error: sErr } = await supabaseAdmin
        .from('subjects')
        .insert({ name: subj.name, code: subj.code })
        .select('id')
        .single();
      if (sErr) throw sErr;
      subjectIds[subj.name] = sData.id;
    }
  }

  // 3. Make sure all subjects are mapped to BCA 4 class.
  console.log('➜ Linking subjects to BCA 4 class...');
  // We'll generate a dummy teacher so we can link it
  let dummyTeacherId: string;
  const { data: extTeacher } = await supabaseAdmin
    .from('teachers')
    .select('id')
    .eq('employee_id', 'SEED_TEACHER')
    .single();

  if (extTeacher) {
    dummyTeacherId = extTeacher.id;
  } else {
    // Need a profile first! Actually, profile_id is required in teachers table.
    // So let's fetch any admin or teacher profile to attach this dummy to
    const { data: adminProfile } = await supabaseAdmin.from('profiles').select('id').limit(1).single();
    const { data: dummyTeacher, error: tErr } = await supabaseAdmin
      .from('teachers')
      .insert({ profile_id: adminProfile?.id, employee_id: 'SEED_TEACHER', department: 'Demo' })
      .select('id')
      .single();
    if (tErr) throw tErr;
    dummyTeacherId = dummyTeacher.id;
  }

  for (const subj of BCA4_SUBJECTS) {
    const { data: csLink } = await supabaseAdmin
      .from('class_subjects')
      .select('id')
      .eq('class_id', classId)
      .eq('subject_id', subjectIds[subj.name])
      .single();

    if (!csLink) {
      await supabaseAdmin
        .from('class_subjects')
        .insert({ class_id: classId, subject_id: subjectIds[subj.name], teacher_id: dummyTeacherId });
    }
  }

  // 4. Generate Sessions
  console.log('➜ Wiping old sessions for BCA 4...');
  await supabaseAdmin.from('sessions').delete().eq('class_id', classId);
  await supabaseAdmin.from('students').delete().eq('class_id', classId);

  console.log('➜ Generating chronological sessions (This may take a moment)...');
  const sessionList: Array<{ id: string, subjectName: string }> = [];
  const now = new Date();
  
  let globalSessionCounter = 0;

  for (const subj of BCA4_SUBJECTS) {
    for (let i = 0; i < subj.total; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (globalSessionCounter++));
      const dateStr = d.toISOString().split('T')[0];
      const timeStr = `${String(9 + (i % 6)).padStart(2, '0')}:00`;

      const { data: sess, error: err } = await supabaseAdmin
        .from('sessions')
        .insert({
          class_id: classId,
          actual_subject_id: subjectIds[subj.name],
          scheduled_subject_id: subjectIds[subj.name],
          scheduled_teacher_id: dummyTeacherId,
          actual_teacher_id: dummyTeacherId,
          date: dateStr,
          start_time: timeStr,
          end_time: `${String(10 + (i % 6)).padStart(2, '0')}:00`,
          status: 'submitted',
        })
        .select('id')
        .single();

      if (err) throw err;
      sessionList.push({ id: sess.id, subjectName: subj.name });
    }
  }

  // 5. Create Students & generate attendance
  console.log('➜ Parsing JSON and generating students & attendance logs...');
  const rawData = fs.readFileSync(path.join(__dirname, '../../scratch/bca4.json'), 'utf8');
  const students = JSON.parse(rawData);

  // Group our sessions by subject for easy access
  const sessionsBySubject: Record<string, string[]> = {};
  for (const sl of sessionList) {
    if (!sessionsBySubject[sl.subjectName]) sessionsBySubject[sl.subjectName] = [];
    sessionsBySubject[sl.subjectName].push(sl.id);
  }

  const BATCH_SIZE = 500;
  let attendanceBuffer: any[] = [];

  for (const std of students) {
    let studentId: string;
    const { data: extStd } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('roll_number', std.regdNo)
      .single();

    if (extStd) {
      studentId = extStd.id;
    } else {
      // Create profile first
      const { data: profData, error: profErr } = await supabaseAdmin
        .from('profiles')
        .insert({ full_name: std.name || `Student ${std.regdNo}`, role: 'student' })
        .select('id')
        .single();
        
      if(profErr) throw profErr;

      const { data: studentRow, error: stdErr } = await supabaseAdmin
        .from('students')
        .insert({ class_id: classId, roll_number: std.regdNo, profile_id: profData.id })
        .select('id')
        .single();
      if (stdErr) throw stdErr;
      studentId = studentRow.id;
    }

    // Loop through their subject marks
    BCA4_SUBJECTS.forEach((subj, idx) => {
      const attendedCount = std.subjectMarks[idx];
      const subjSessions = sessionsBySubject[subj.name];

      subjSessions.forEach((sessId, sIndex) => {
        attendanceBuffer.push({
          session_id: sessId,
          student_id: studentId,
          status: sIndex < attendedCount ? 'present' : 'absent'
        });
      });
    });

    if (attendanceBuffer.length >= BATCH_SIZE) {
      const { error: insErr } = await supabaseAdmin.from('attendance').insert(attendanceBuffer);
      if (insErr) throw insErr;
      attendanceBuffer = [];
    }
  }

  if (attendanceBuffer.length > 0) {
     const { error: insErr } = await supabaseAdmin.from('attendance').insert(attendanceBuffer);
     if (insErr) throw insErr;
  }

  console.log('✅ BCA4 Seeder complete!');
}

run().catch(console.error);
