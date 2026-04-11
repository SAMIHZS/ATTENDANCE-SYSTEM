import { subjectsRepository } from '../repositories/subjectsRepository';
import type { Subject } from '../types';

export const subjectsService = {
  async list(): Promise<Subject[]> {
    return subjectsRepository.findAll();
  },

  async getById(id: string): Promise<Subject> {
    const subject = await subjectsRepository.findById(id);
    if (!subject) throw Object.assign(new Error('Subject not found'), { statusCode: 404 });
    return subject;
  },

  async create(name: string, code?: string): Promise<Subject> {
    if (!name?.trim()) throw Object.assign(new Error('Subject name is required'), { statusCode: 400 });
    return subjectsRepository.create(name.trim(), code?.trim());
  },
};
