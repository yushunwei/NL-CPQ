import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { env } from '../config/env';

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('邮箱已被注册');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    const token = this.signToken(user.id, user.role);
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('邮箱或密码错误');
    if (!user.isActive) throw new Error('账号已被禁用');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('邮箱或密码错误');

    const token = this.signToken(user.id, user.role);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new Error('用户不存在');
    return user;
  }

  private signToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
