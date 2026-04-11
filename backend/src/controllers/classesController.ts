import type { Request, Response, NextFunction } from 'express';
import { classesService } from '../services/classesService';

export const classesController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await classesService.list();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await classesService.getById(String(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await classesService.create(String(req.body.name));
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  },
};
