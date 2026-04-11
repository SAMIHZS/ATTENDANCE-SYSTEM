import type { Request, Response, NextFunction } from 'express';
import { subjectsService } from '../services/subjectsService';

export const subjectsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await subjectsService.list();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await subjectsService.getById(String(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await subjectsService.create(req.body.name, req.body.code);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },
};
