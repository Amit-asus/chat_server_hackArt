import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { uploadImage, uploadFile } from '../../common/middleware/upload.middleware';
import { AuthenticatedRequest } from '../../types';
import { prisma } from '../../lib/prisma';
import { getIo } from '../../lib/socket-instance';
import { config } from '../../config/env';
import { createError } from '../../common/middleware/error.middleware';

const router = Router();
router.use(authMiddleware as any);

const msgSelect = {
  id: true, roomId: true, content: true, isEdited: true,
  createdAt: true, updatedAt: true,
  sender: { select: { id: true, username: true } },
  replyTo: {
    select: {
      id: true, content: true,
      sender: { select: { id: true, username: true } },
    },
  },
  attachments: true,
};

const wrap = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: any, res: Response, next: NextFunction) => fn(req, res, next);

// Upload image attached to a message
router.post('/image/:roomId', uploadImage.single('file'), wrap(async (req, res, next) => {
  try {
    if (!req.file) throw createError('No file uploaded', 400);

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: req.params.roomId, userId: req.userId } },
    });
    if (!member) throw createError('Not a member', 403);

    const { comment, messageId } = req.body;

    let targetMessageId = messageId;
    if (!targetMessageId) {
      const msg = await prisma.message.create({
        data: { roomId: req.params.roomId, senderId: req.userId, content: comment || null },
      });
      targetMessageId = msg.id;
    }

    await prisma.attachment.create({
      data: {
        messageId: targetMessageId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        comment,
      },
    });

    const fullMessage = await prisma.message.findUnique({
      where: { id: targetMessageId },
      select: msgSelect,
    });

    getIo().to(`room:${req.params.roomId}`).emit('message:new', fullMessage);
    res.status(201).json({ message: fullMessage });
  } catch (err) { next(err); }
}));

// Upload arbitrary file
router.post('/file/:roomId', uploadFile.single('file'), wrap(async (req, res, next) => {
  try {
    if (!req.file) throw createError('No file uploaded', 400);

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: req.params.roomId, userId: req.userId } },
    });
    if (!member) throw createError('Not a member', 403);

    const { comment, messageId } = req.body;

    let targetMessageId = messageId;
    if (!targetMessageId) {
      const msg = await prisma.message.create({
        data: { roomId: req.params.roomId, senderId: req.userId, content: comment || null },
      });
      targetMessageId = msg.id;
    }

    await prisma.attachment.create({
      data: {
        messageId: targetMessageId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        comment,
      },
    });

    const fullMessage = await prisma.message.findUnique({
      where: { id: targetMessageId },
      select: msgSelect,
    });

    getIo().to(`room:${req.params.roomId}`).emit('message:new', fullMessage);
    res.status(201).json({ message: fullMessage });
  } catch (err) { next(err); }
}));

// Download file — access controlled
router.get('/:type/:filename', wrap(async (req, res, next) => {
  try {
    const { type, filename } = req.params;
    if (!['images', 'files'].includes(type)) throw createError('Invalid file type', 400);

    // Find attachment
    const attachment = await prisma.attachment.findFirst({ where: { filename } });
    if (!attachment) throw createError('File not found', 404);

    // Check membership
    const message = await prisma.message.findUnique({ where: { id: attachment.messageId } });
    if (!message) throw createError('File not found', 404);

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: message.roomId, userId: req.userId } },
    });
    if (!member) throw createError('Access denied', 403);

    const filePath = path.join(process.cwd(), config.uploadsDir, type, filename);
    if (!fs.existsSync(filePath)) throw createError('File not found on disk', 404);

    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.sendFile(path.resolve(filePath));
  } catch (err) { next(err); }
}));

export default router;
