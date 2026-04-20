import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { AuthenticatedRequest } from '../../types';

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, username, password } = req.body;
    const user = await authService.register(email, username, password);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const browserInfo = req.headers['user-agent'];

    const { token, user } = await authService.login(email, password, ip, browserInfo);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.sessionId);
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function getSessionsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sessions = await authService.getSessions(req.userId);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function revokeSessionHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await authService.revokeSession(req.params.sessionId, req.userId);
    res.json({ message: 'Session revoked' });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.userId, oldPassword, newPassword);
    res.json({ message: 'Password changed' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccountHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await authService.deleteAccount(req.userId);
    res.clearCookie('token');
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await import('../../lib/prisma').then(m =>
      m.prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, username: true, createdAt: true },
      })
    );
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
