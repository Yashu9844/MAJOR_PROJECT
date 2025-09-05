import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.userDoc?.role;
  if (role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });
  next();
}
