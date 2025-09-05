import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/roles';

const r = Router();

r.get('/me', requireAuth, async (req, res) => {
  res.json({
    clerkUserId: req.auth?.clerkUserId,
    email: req.auth?.email,
    role: req.userDoc?.role,
  });
});

r.get('/admin/ping', requireAuth, requireAdmin, (req, res) => {
  res.json({ ok: true, message: 'Admin access confirmed' });
});

r.get('/protected', requireAuth, (req, res) => {
  res.json({
    message: 'Protected route accessed successfully',
    user: {
      clerkUserId: req.auth?.clerkUserId,
      email: req.auth?.email,
      name: req.userDoc?.name,
      role: req.userDoc?.role,
      lastLoginAt: req.userDoc?.lastLoginAt,
    }
  });
});

export default r;
