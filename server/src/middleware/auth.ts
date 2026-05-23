import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  // Support Bearer header or ?token= query param (for PDF downloads)
  let token: string | undefined;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ message: '未登录' });
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ message: '登录已过期' });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}
