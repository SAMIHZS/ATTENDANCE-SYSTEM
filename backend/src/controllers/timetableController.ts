import type { Request, Response, NextFunction } from 'express';
import { timetableService } from '../services/timetableService';
import type { DayOfWeek } from '../types';

export const timetableController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { class_id, teacher_id, day_of_week } = req.query as Record<string, string>;
      const data = await timetableService.list({
        class_id: class_id || undefined,
        teacher_id: teacher_id || undefined,
        day_of_week: (day_of_week as DayOfWeek) || undefined,
      });
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async currentSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const teacher_id = req.auth?.profileId;
      if (!teacher_id) { res.status(401).json({ success: false, message: 'Not authenticated' }); return; }

      // Find teacher row from profile id
      const { supabaseAdmin } = await import('../lib/supabase');
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('profile_id', teacher_id)
        .single();

      if (!teacher) { res.json({ success: true, data: null }); return; }

      const data = await timetableService.getCurrentSlot(teacher.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },
};
