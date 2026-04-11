import { supabaseAdmin } from '../lib/supabase';
import type { Subject } from '../types';

export const subjectsRepository = {
  async findAll(): Promise<Subject[]> {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: string): Promise<Subject | null> {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(name: string, code?: string): Promise<Subject> {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({ name, code: code ?? null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, name: string, code?: string): Promise<Subject> {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update({ name, code: code ?? null })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
