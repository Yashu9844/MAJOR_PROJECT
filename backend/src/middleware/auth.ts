import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';
import User from '../models/User.model';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        clerkUserId: string;
        email?: string;
      };
      userDoc?: any; // populated Mongo user
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authz = req.headers.authorization;
    if (!authz?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Bearer token' });
    }

    const token = authz.replace('Bearer ', '').trim();

    // Verify token with Clerk
    const payload = await verifyToken(token, {
      // audience / issuer optional depending on your JWT template
      // audience: 'your-backend',
      // jwtKey: process.env.CLERK_JWT_KEY, // not needed for standard templates
    });

    const clerkUserId = payload.sub as string;
    const email =
      (payload.email as string) ||
      (Array.isArray(payload.email_addresses) ? payload.email_addresses[0] : undefined);

    // Lazy-sync user into MongoDB
    let user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      const isAdmin = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .includes((email || '').toLowerCase());

      user = await User.create({
        clerkId: clerkUserId,
        email,
        name: payload.name || payload.full_name,
        imageUrl: payload.image || payload.picture,
        role: isAdmin ? 'ADMIN' : 'USER',
        lastLoginAt: new Date(),
      });
    } else {
      user.lastLoginAt = new Date();
      await user.save();
    }

    req.auth = { clerkUserId, email };
    req.userDoc = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
