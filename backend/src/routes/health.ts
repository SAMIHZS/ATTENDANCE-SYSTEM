import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'BCA Student Hub API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? 'development',
    },
  });
});
