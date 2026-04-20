import { Router, Response, NextFunction } from 'express';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { AuthenticatedRequest } from '../../types';
import * as usersService from './users.service';

const router = Router();

router.use(authMiddleware as any);

router.get('/search', (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) { res.json({ users: [] }); return; }
    const users = await usersService.searchUsers(q, req.userId);
    res.json({ users });
  } catch (err) { next(err); }
}) as any);

router.get('/:username', (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await usersService.getUserByUsername(req.params.username);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (err) { next(err); }
}) as any);

export default router;
