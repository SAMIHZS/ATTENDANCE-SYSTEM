import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth, requireRole } from '../middleware/auth';
import { jsonToCsv } from '../utils/csvHelper';

const adminRouter = Router();

// Root guard protecting all admin routes
adminRouter.use(requireAuth);
adminRouter.use(requireRole('admin'));

adminRouter.get('/dashboard', async (req, res) => {
  try {
    // Optimized: Single RPC call handles all institutional aggregations in SQL
    const { data: stats, error } = await supabaseAdmin.rpc('get_institution_stats');
    
    if (error) throw error;

    return res.json({
      success: true,
      data: {
        totalStudents: stats.total_students,
        totalClasses: stats.total_classes,
        totalTeachers: stats.total_teachers,
        todaySessions: stats.today_sessions,
        averageAttendance: stats.average_attendance,
      }
    });

  } catch (error: any) {
    console.error('Admin Dashboard Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch global metrics' });
  }
});

adminRouter.get('/reports', async (req, res) => {
  try {
    const classId = req.query.classId ? String(req.query.classId) : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(500, Number(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    // Optimized: Fetch grouped attendance stats per student+subject via SQL RPC (with pagination)
    const { data: attendanceStats, error: attErr } = await supabaseAdmin
      .rpc('get_admin_attendance_report', { 
        p_class_id: classId || null,
        p_limit: limit,
        p_offset: offset
      });
    
    if (attErr) throw attErr;

    const totalStudentsCount = attendanceStats?.[0]?.total_count || 0;

    // Fetch matching student detail info for this page
    const studentIds = Array.from(new Set(attendanceStats?.map((row: any) => row.student_id) || []));
    
    let studentsData: any[] = [];
    if (studentIds.length > 0) {
        const { data: found, error: stdErr } = await supabaseAdmin
          .from('students')
          .select('id, roll_number, classes:class_id(name)')
          .in('id', studentIds);
        if (stdErr) throw stdErr;
        studentsData = found || [];
    }

    // Map aggregated stats to student objects for compatibility with existing UI
    const statsMap: Record<string, any[]> = {};
    attendanceStats?.forEach((row: any) => {
      if (!statsMap[row.student_id]) statsMap[row.student_id] = [];
      statsMap[row.student_id].push({
        status: row.attended_classes > 0 ? 'present' : 'absent',
        count_data: { total: row.total_classes, attended: row.attended_classes },
        sessions: { actual_subject_id: row.subject_id }
      });
    });

    // Reconstruct the nested structure
    const enrichedStudents = studentsData.map(s => ({
      ...s,
      attendance: statsMap[s.id] || []
    }));

    const { data: subjectsData, error: sErr } = await supabaseAdmin.from('subjects').select('id, name');
    if (sErr) throw sErr;

    const subjectsMap: Record<string, string> = {};
    for (const s of subjectsData) {
      subjectsMap[s.id] = s.name;
    }

    return res.json({
      success: true,
      data: {
        students: enrichedStudents,
        subjectsMap,
        meta: {
            page,
            limit,
            totalStudents: totalStudentsCount,
            totalPages: Math.ceil(Number(totalStudentsCount) / limit)
        }
      }
    });
  } catch (error: any) {
     console.error('Admin Reports Error:', error);
     return res.status(500).json({ success: false, error: 'Failed to fetch deep reports' });
  }
});

// ============================================================================
// EXPORTS (Phase 7)
// ============================================================================

adminRouter.get('/reports/export/class', async (req, res) => {
  try {
    const { classId, from, to } = req.query;
    if (!classId) return res.status(400).json({ success: false, error: 'classId is required' });

    // Fetch stats for ALL students in class (high limit)
    const { data: stats, error } = await supabaseAdmin.rpc('get_admin_attendance_report', {
      p_class_id: classId as string,
      p_start_date: (from as string) || null,
      p_end_date: (to as string) || null,
      p_limit: 10000,
      p_offset: 0
    });
    if (error) throw error;

    // Fetch subjects and students for clean names
    const [{ data: subjects }, { data: students }] = await Promise.all([
      supabaseAdmin.from('subjects').select('id, name').order('name'),
      supabaseAdmin.from('students').select('id, roll_number, profile:profiles(full_name)').eq('class_id', classId)
    ]);

    const subjectsMap = (subjects || []).reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {} as any);
    const subjectIds = (subjects || []).map(s => s.id);

    // Pivot data
    const pivot: Record<string, any> = {};
    stats?.forEach((row: any) => {
      if (!pivot[row.student_id]) pivot[row.student_id] = { subjects: {} };
      pivot[row.student_id].subjects[row.subject_id] = {
        attended: row.attended_classes,
        total: row.total_classes
      };
    });

    // Build Rows
    const headers = ['Roll Number', 'Student Name', 'Overall %', ...(subjects || []).map(s => `${s.name} (%)`)];
    const rows = (students || []).map(s => {
      const studentStats = pivot[s.id] || { subjects: {} };
      let grandTotal = 0;
      let grandAttended = 0;

      const subjectCols = subjectIds.map(sid => {
        const score = studentStats.subjects[sid];
        if (!score || score.total === 0) return '-';
        grandTotal += score.total;
        grandAttended += score.attended;
        return `${Math.round((score.attended / score.total) * 100)}%`;
      });

      const overallPercent = grandTotal === 0 ? '0%' : `${Math.round((grandAttended / grandTotal) * 100)}%`;
      return [s.roll_number, (s.profile as any)?.full_name || 'Unknown', overallPercent, ...subjectCols];
    });

    const csv = jsonToCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_class_${classId}_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (error: any) {
    console.error('Export Class Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate class export' });
  }
});

adminRouter.get('/reports/export/subject', async (req, res) => {
  try {
    const { classId, subjectId, from, to } = req.query;
    if (!classId || !subjectId) return res.status(400).json({ success: false, error: 'classId and subjectId are required' });

    const { data: stats, error } = await supabaseAdmin.rpc('get_admin_attendance_report', {
      p_class_id: classId as string,
      p_start_date: (from as string) || null,
      p_end_date: (to as string) || null,
      p_limit: 10000,
      p_offset: 0
    });
    if (error) throw error;

    const { data: students } = await supabaseAdmin.from('students').select('id, roll_number, profile:profiles(full_name)').eq('class_id', classId);
    const { data: subject } = await supabaseAdmin.from('subjects').select('name').eq('id', subjectId).single();

    const filtered = stats?.filter((s: any) => s.subject_id === subjectId) || [];
    const statsMap = filtered.reduce((acc: any, s: any) => ({ ...acc, [s.student_id]: s }), {});

    const headers = ['Roll Number', 'Student Name', 'Subject', 'Attended', 'Total', 'Percentage'];
    const rows = (students || []).map(s => {
      const score = statsMap[s.id];
      const percent = score && score.total_classes > 0 ? `${Math.round((score.attended_classes / score.total_classes) * 100)}%` : '0%';
      return [
        s.roll_number, 
        (s.profile as any)?.full_name || 'Unknown', 
        subject?.name || 'Unknown', 
        score?.attended_classes || 0, 
        score?.total_classes || 0, 
        percent
      ];
    });

    const csv = jsonToCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_subject_${subjectId}_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (error: any) {
    console.error('Export Subject Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate subject export' });
  }
});

adminRouter.get('/reports/export/sessions', async (req, res) => {
  try {
    const { classId, from, to } = req.query;
    if (!classId) return res.status(400).json({ success: false, error: 'classId is required' });

    const { data: logs, error } = await supabaseAdmin.rpc('get_session_details_export', {
      p_class_id: classId as string,
      p_start_date: (from as string) || null,
      p_end_date: (to as string) || null
    });
    if (error) throw error;

    const headers = ['Date', 'Time Slot', 'Subject', 'Roll Number', 'Student Name', 'Status'];
    const rows = (logs || []).map((l: any) => [
      l.date,
      l.start_time,
      l.subject_name,
      l.roll_number,
      l.student_name,
      l.status
    ]);

    const csv = jsonToCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_sessions_${classId}_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (error: any) {
    console.error('Export Sessions Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate sessions export' });
  }
});

adminRouter.post('/attendance/override', async (req, res) => {
  try {
    const { attendanceId, status } = req.body;
    if (!attendanceId || !['present', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid attendance override configuration' });
    }

    // First get the attendance log to find its session
    const { data: attLog, error: attErr } = await supabaseAdmin
      .from('attendance')
      .select('session_id')
      .eq('id', attendanceId)
      .single();
    if (attErr) throw attErr;

    // Transaction-like update via two operations
    const { error } = await supabaseAdmin
       .from('attendance')
       .update({ status })
       .eq('id', attendanceId);
    if (error) throw error;

    await supabaseAdmin
       .from('sessions')
       .update({ status: 'edited' })
       .eq('id', attLog.session_id);

    return res.json({ success: true, message: 'Overridden successfully' });
  } catch (error: any) {
    console.error('Attendance Override Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to override attendance' });
  }
});

// ============================================================================
// ADMIN CRUD (Lite)
// ============================================================================

adminRouter.get('/classes', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('classes').select('id, name').order('name');
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.post('/classes', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  console.log(`[Admin] Creating class: ${name}`);
  const { data, error } = await supabaseAdmin.from('classes').insert({ name }).select().single();
  
  if (error) {
    console.error('[Admin] Create class error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

adminRouter.put('/classes/:id', async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabaseAdmin.from('classes').update({ name }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.get('/subjects', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('subjects').select('id, name, code').order('name');
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.post('/subjects', async (req, res) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

  console.log(`[Admin] Creating subject: ${name} (${code})`);
  const { data, error } = await supabaseAdmin.from('subjects').insert({ name, code }).select().single();
  
  if (error) {
    console.error('[Admin] Create subject error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

adminRouter.put('/subjects/:id', async (req, res) => {
  const { name, code } = req.body;
  const { data, error } = await supabaseAdmin.from('subjects').update({ name, code }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// -- Teachers & Students
adminRouter.get('/teachers', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('teachers').select('id, employee_id, profile:profiles(full_name, email)');
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.get('/students', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('students').select('id, roll_number, class:classes(name), profile:profiles(full_name, email)');
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// -- Class-Subjects Mapper
adminRouter.get('/class-subjects', async (req, res) => {
  const { classId } = req.query;
  let q = supabaseAdmin.from('class_subjects').select('id, class_id, subject:subjects(id, name), teacher:teachers(id, profile:profiles(full_name))');
  if (classId) q = q.eq('class_id', classId);
  const { data, error } = await q;
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.post('/class-subjects', async (req, res) => {
  const { class_id, subject_id, teacher_id } = req.body;
  const { data, error } = await supabaseAdmin.from('class_subjects').insert({ class_id, subject_id, teacher_id }).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.put('/class-subjects/:id', async (req, res) => {
  const { teacher_id } = req.body;
  const { data, error } = await supabaseAdmin.from('class_subjects').update({ teacher_id }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// -- Timetable
adminRouter.get('/timetable', async (req, res) => {
  const { classId } = req.query;
  let q = supabaseAdmin.from('timetable').select('id, class_id, subject:subjects(id, name), teacher:teachers(id, profile:profiles(full_name)), day_of_week, start_time, end_time');
  if (classId) q = q.eq('class_id', classId);
  const { data, error } = await q;
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.post('/timetable', async (req, res) => {
  const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time } = req.body;
  // Conflict Check
  const { data: conflicts } = await supabaseAdmin.from('timetable')
    .select('id')
    .eq('class_id', class_id)
    .eq('day_of_week', day_of_week)
    .gt('end_time', start_time)
    .lt('start_time', end_time);
    
  if (conflicts && conflicts.length > 0) {
    return res.status(409).json({ success: false, error: 'Time slot overlaps with existing slot for this class.' });
  }

  console.log(`[Admin] Creating timetable slot: ${day_of_week} ${start_time}-${end_time}`);
  const { data, error } = await supabaseAdmin.from('timetable')
    .insert({ class_id, subject_id, teacher_id, day_of_week, start_time, end_time })
    .select().single();
    
  if (error) {
    console.error('[Admin] Create timetable error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
  return res.json({ success: true, data });
});

adminRouter.put('/timetable/:id', async (req, res) => {
  const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time } = req.body;
  const { data, error } = await supabaseAdmin.from('timetable')
    .update({ class_id, subject_id, teacher_id, day_of_week, start_time, end_time })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

adminRouter.delete('/timetable/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('timetable').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
});

// -- Attendance Explorer 
adminRouter.get('/attendance/sessions', async (req, res) => {
  const { classId, date } = req.query;
  let q = supabaseAdmin.from('sessions').select(`
    id, date, start_time, end_time, status, 
    class:classes(name), 
    subject:subjects!sessions_actual_subject_id_fkey(name), 
    teacher:teachers!sessions_actual_teacher_id_fkey(profile:profiles(full_name))
  `).order('date', { ascending: false }).order('start_time', { ascending: false });
  
  if (classId) q = q.eq('class_id', classId);
  if (date) q = q.eq('date', date);

  const { data, error } = await q;
  if (error) return res.status(500).json({ success: false, error: error.message });
  
  // Optional: add distinct count of present vs total dynamically for these sessions.
  return res.json({ success: true, data });
});

adminRouter.get('/attendance/sessions/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('attendance').select(`
    id, status, student:students(id, roll_number, profile:profiles(full_name))
  `).eq('session_id', req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

export { adminRouter };
