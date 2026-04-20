import { Router, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { AuthenticatedRequest } from '../../types';
import * as roomsService from './rooms.service';
import { RoomVisibility } from '@prisma/client';

const router = Router();
router.use(authMiddleware as any);

type Handler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;

const wrap = (fn: Handler) => (req: any, res: Response, next: NextFunction) => fn(req, res, next);

router.get('/public', wrap(async (req, res, next) => {
  try {
    const rooms = await roomsService.getPublicRooms(req.query.search as string);
    res.json({ rooms });
  } catch (err) { next(err); }
}));

router.get('/mine', wrap(async (req, res, next) => {
  try {
    const rooms = await roomsService.getUserRooms(req.userId);
    res.json({ rooms });
  } catch (err) { next(err); }
}));

router.get('/invitations', wrap(async (req, res, next) => {
  try {
    const invitations = await roomsService.getPendingInvitations(req.userId);
    res.json({ invitations });
  } catch (err) { next(err); }
}));

router.post('/invitations/:id/accept', wrap(async (req, res, next) => {
  try {
    await roomsService.acceptInvitation(req.params.id, req.userId);
    res.json({ message: 'Invitation accepted' });
  } catch (err) { next(err); }
}));

router.post('/', [
  body('name').isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('visibility').isIn(['PUBLIC', 'PRIVATE']),
], wrap(async (req, res, next) => {
  try {
    const { name, description, visibility } = req.body;
    const room = await roomsService.createRoom(req.userId, name, description, visibility as RoomVisibility);
    res.status(201).json({ room });
  } catch (err) { next(err); }
}));

router.get('/:roomId', wrap(async (req, res, next) => {
  try {
    const room = await roomsService.getRoomById(req.params.roomId, req.userId);
    res.json({ room });
  } catch (err) { next(err); }
}));

router.put('/:roomId', wrap(async (req, res, next) => {
  try {
    const room = await roomsService.updateRoom(req.params.roomId, req.userId, req.body);
    res.json({ room });
  } catch (err) { next(err); }
}));

router.delete('/:roomId', wrap(async (req, res, next) => {
  try {
    await roomsService.deleteRoom(req.params.roomId, req.userId);
    res.json({ message: 'Room deleted' });
  } catch (err) { next(err); }
}));

router.post('/:roomId/join', wrap(async (req, res, next) => {
  try {
    const room = await roomsService.joinRoom(req.params.roomId, req.userId);
    res.json({ room });
  } catch (err) { next(err); }
}));

router.post('/:roomId/leave', wrap(async (req, res, next) => {
  try {
    await roomsService.leaveRoom(req.params.roomId, req.userId);
    res.json({ message: 'Left room' });
  } catch (err) { next(err); }
}));

router.get('/:roomId/members', wrap(async (req, res, next) => {
  try {
    const members = await roomsService.getRoomMembers(req.params.roomId, req.userId);
    res.json({ members });
  } catch (err) { next(err); }
}));

router.get('/:roomId/banned', wrap(async (req, res, next) => {
  try {
    const banned = await roomsService.getBannedUsers(req.params.roomId, req.userId);
    res.json({ banned });
  } catch (err) { next(err); }
}));

router.post('/:roomId/ban/:targetUserId', wrap(async (req, res, next) => {
  try {
    await roomsService.banMember(req.params.roomId, req.params.targetUserId, req.userId);
    res.json({ message: 'User banned' });
  } catch (err) { next(err); }
}));

router.delete('/:roomId/ban/:targetUserId', wrap(async (req, res, next) => {
  try {
    await roomsService.unbanMember(req.params.roomId, req.params.targetUserId, req.userId);
    res.json({ message: 'User unbanned' });
  } catch (err) { next(err); }
}));

router.post('/:roomId/admin/:targetUserId', wrap(async (req, res, next) => {
  try {
    await roomsService.makeAdmin(req.params.roomId, req.params.targetUserId, req.userId);
    res.json({ message: 'Admin added' });
  } catch (err) { next(err); }
}));

router.delete('/:roomId/admin/:targetUserId', wrap(async (req, res, next) => {
  try {
    await roomsService.removeAdmin(req.params.roomId, req.params.targetUserId, req.userId);
    res.json({ message: 'Admin removed' });
  } catch (err) { next(err); }
}));

router.post('/:roomId/invite', [body('username').notEmpty()], wrap(async (req, res, next) => {
  try {
    await roomsService.inviteUser(req.params.roomId, req.userId, req.body.username);
    res.json({ message: 'Invitation sent' });
  } catch (err) { next(err); }
}));

router.post('/dm/:targetUserId', wrap(async (req, res, next) => {
  try {
    const room = await roomsService.getOrCreateDM(req.userId, req.params.targetUserId);
    res.json({ room });
  } catch (err) { next(err); }
}));

export default router;
