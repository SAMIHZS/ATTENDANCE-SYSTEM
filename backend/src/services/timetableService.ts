import { timetableRepository } from '../repositories/timetableRepository';
import type { TimetableSlot, DayOfWeek } from '../types';

export const timetableService = {
  async list(filters?: {
    class_id?: string;
    teacher_id?: string;
    day_of_week?: DayOfWeek;
  }): Promise<TimetableSlot[]> {
    return timetableRepository.findAll(filters);
  },

  /**
   * Find the currently active timetable slot for a teacher.
   * Called at session-start time to auto-populate subject/class.
   * Returns null if no slot matches current time.
   */
  async getCurrentSlot(teacher_id: string): Promise<TimetableSlot | null> {
    const now = new Date();
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[];
    // Note: Sunday = 0 in JS, but DB only has Mon–Sat; return null on Sunday
    const day = days[now.getDay()];
    if (!day || day === ('sunday' as DayOfWeek)) return null;

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const time = `${hh}:${mm}`;

    return timetableRepository.findCurrentSlotForTeacher(teacher_id, day, time);
  },
};
