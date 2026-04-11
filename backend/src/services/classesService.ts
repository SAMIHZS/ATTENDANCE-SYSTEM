import { classesRepository } from '../repositories/classesRepository';
import type { Class } from '../types';

export const classesService = {
  async list(): Promise<Class[]> {
    return classesRepository.findAll();
  },

  async getById(id: string): Promise<Class> {
    const cls = await classesRepository.findById(id);
    if (!cls) throw Object.assign(new Error('Class not found'), { statusCode: 404 });
    return cls;
  },

  async create(name: string): Promise<Class> {
    if (!name?.trim()) throw Object.assign(new Error('Class name is required'), { statusCode: 400 });
    return classesRepository.create(name.trim());
  },
};
