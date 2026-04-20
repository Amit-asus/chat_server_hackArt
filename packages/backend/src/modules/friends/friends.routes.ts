import { Router, Response, NextFunction } from 'express';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { AuthenticatedRequest } from '../../types';
import * as friendsService from './friends.service';

const router = Router();
router.use(authMiddleware as any);

const wrap = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: any, res: Response, next: NextFunction) => fn(req, res, next);

router.get('/', wrap(async (req, res, next) => {
  try {
    const friends = await friendsService.getFriends(req.userId);
    res.json({ friends });
  } catch (err) { next(err); }
}));

router.get('/requests', wrap(async (req, res, next) => {
  try {
    const requests = await friendsService.getPendingRequests(req.userId);
    res.json({ requests });
  } catch (err) { next(err); }
}));

router.get('/banned', wrap(async (req, res, next) => {
  try {
    const banned = await friendsService.getBannedUsers(req.userId);
    res.json({ banned });
  } catch (err) { next(err); }
}));

router.post('/request', wrap(async (req, res, next) => {
  try {
    const { username, message } = req.body;
    const request = await friendsService.sendFriendRequest(req.userId, username, message);
    res.status(201).json({ request });
  } catch (err) { next(err); }
}));

router.post('/request/:id/accept', wrap(async (req, res, next) => {
  try {
    const friendship = await friendsService.respondToRequest(req.params.id, req.userId, true);
    res.json({ friendship });
  } catch (err) { next(err); }
}));

router.post('/request/:id/decline', wrap(async (req, res, next) => {
  try {
    await friendsService.respondToRequest(req.params.id, req.userId, false);
    res.json({ message: 'Request declined' });
  } catch (err) { next(err); }
}));

router.delete('/:friendId', wrap(async (req, res, next) => {
  try {
    await friendsService.removeFriend(req.userId, req.params.friendId);
    res.json({ message: 'Friend removed' });
  } catch (err) { next(err); }
}));

router.post('/ban', wrap(async (req, res, next) => {
  try {
    await friendsService.banUser(req.userId, req.body.username);
    res.json({ message: 'User banned' });
  } catch (err) { next(err); }
}));

router.delete('/ban/:bannedId', wrap(async (req, res, next) => {
  try {
    await friendsService.unbanUser(req.userId, req.params.bannedId);
    res.json({ message: 'User unbanned' });
  } catch (err) { next(err); }
}));

export default router;
