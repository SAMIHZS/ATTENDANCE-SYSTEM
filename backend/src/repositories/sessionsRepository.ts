import { supabaseAdmin } from '../lib/supabase';
import type { Session, SessionStatus } from '../types';

export const sessionsRepository = {
  async findById(id: string): Promise<Session | null> {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        class:classes(id, name),
        actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code),
        scheduled_subject:subjects!sessions_scheduled_subject_id_fkey(id, name, code)
      `)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ?? null;
  },

  async findByTeacher(teacher_id: string, limit = 20): Promise<Session[]> {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        class:classes(id, name),
        actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code),
        scheduled_subject:subjects!sessions_scheduled_subject_id_fkey(id, name, code)
      `)
      .eq('actual_teacher_id', teacher_id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  async findByClassAndDate(class_id: string, date: string): Promise<Session[]> {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select(`
        *,
        class:classes(id, name),
        actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code),
        scheduled_subject:subjects!sessions_scheduled_subject_id_fkey(id, name, code)
      `)
      .eq('class_id', class_id)
      .eq('date', date)
      .order('start_time');
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Upsert a session (idempotent — unique on class_id + date + start_time).
   * Returns the session whether it existed or was just created.
   */
  async upsert(payload: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session> {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .upsert(payload, { onConflict: 'class_id,date,start_time' })
      .select(`
        *,
        class:classes(id, name),
        actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code),
        scheduled_subject:subjects!sessions_scheduled_subject_id_fkey(id, name, code)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: SessionStatus, submitted_at?: string): Promise<Session> {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .update({ status, ...(submitted_at ? { submitted_at } : {}) })
      .eq('id', id)
      .select(`
        *,
        class:classes(id, name),
        actual_subject:subjects!sessions_actual_subject_id_fkey(id, name, code),
        scheduled_subject:subjects!sessions_scheduled_subject_id_fkey(id, name, code)
      `)
      .single();
    if (error) throw error;
    return data;
  },
};
