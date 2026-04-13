import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    auth: { getUser: vi.fn() },
    from: vi.fn()
  }
}));

import { requireRole } from './auth';
import type { Request, Response, NextFunction } from 'express';

describe('requireRole middleware', () => {
  it('should call next() if user has required role', () => {
    const roles = ['admin', 'teacher'] as any[];
    const middleware = requireRole(...roles);
    
    const req = {
      auth: { role: 'admin' }
    } as unknown as Request;
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 if user has incorrect role', () => {
    const middleware = requireRole('admin');
    
    const req = {
      auth: { role: 'student' }
    } as unknown as Request;
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 401 if req.auth is missing', () => {
    const middleware = requireRole('admin');
    
    const req = {} as Request;
    
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
