import { supabaseAdmin } from '../lib/supabase';
import type { Class } from '../types';

export const classesRepository = {
  async findAll(): Promise<Class[]> {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select('*')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: string): Promise<Class | null> {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(name: string): Promise<Class> {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, name: string): Promise<Class> {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
