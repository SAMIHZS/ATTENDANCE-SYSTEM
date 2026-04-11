import { supabaseAdmin } from '../lib/supabase';
import type { TimetableSlot, DayOfWeek } from '../types';

export const timetableRepository = {
  /** All slots, optionally filtered by class or teacher */
  async findAll(filters?: {
    class_id?: string;
    teacher_id?: string;
    day_of_week?: DayOfWeek;
  }): Promise<TimetableSlot[]> {
    let query = supabaseAdmin
      .from('timetable')
      .select(`
        *,
        class:classes(id, name),
        subject:subjects(id, name, code),
        teacher:teachers(id, employee_id, profile:profiles(full_name))
      `)
      .order('day_of_week')
      .order('start_time');

    if (filters?.class_id) query = query.eq('class_id', filters.class_id);
    if (filters?.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
    if (filters?.day_of_week) query = query.eq('day_of_week', filters.day_of_week);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as TimetableSlot[];
  },

  /**
   * Find the timetable slot active right now for a teacher.
   * Used for live class detection in Phase 4.
   */
  async findCurrentSlotForTeacher(
    teacher_id: string,
    day: DayOfWeek,
    time: string          // "HH:MM"
  ): Promise<TimetableSlot | null> {
    const { data, error } = await supabaseAdmin
      .from('timetable')
      .select('*')
      .eq('teacher_id', teacher_id)
      .eq('day_of_week', day)
      .lte('start_time', time)
      .gte('end_time', time)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ?? null;
  },
};
