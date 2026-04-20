import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../types';

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payload = verifyToken(token);

    // Verify session still exists in DB
    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId, token },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
