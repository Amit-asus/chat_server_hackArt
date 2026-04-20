import { Router, Response, NextFunction } from 'express';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { AuthenticatedRequest } from '../../types';
import * as messagesService from './messages.service';

const router = Router();
router.use(authMiddleware as any);

const wrap = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: any, res: Response, next: NextFunction) => fn(req, res, next);

router.get('/room/:roomId', wrap(async (req, res, next) => {
  try {
    const messages = await messagesService.getMessages(
      req.params.roomId, req.userId, req.query.cursor as string | undefined
    );
    res.json({ messages });
  } catch (err) { next(err); }
}));

router.post('/room/:roomId', wrap(async (req, res, next) => {
  try {
    const { content, replyToId } = req.body;
    const message = await messagesService.sendMessage(req.params.roomId, req.userId, content, replyToId);
    res.status(201).json({ message });
  } catch (err) { next(err); }
}));

router.put('/:messageId', wrap(async (req, res, next) => {
  try {
    const message = await messagesService.editMessage(req.params.messageId, req.userId, req.body.content);
    res.json({ message });
  } catch (err) { next(err); }
}));

router.delete('/:messageId', wrap(async (req, res, next) => {
  try {
    await messagesService.deleteMessage(req.params.messageId, req.userId);
    res.json({ message: 'Message deleted' });
  } catch (err) { next(err); }
}));

export default router;
