import { prisma } from '../../lib/prisma';
import { createError } from '../../common/middleware/error.middleware';
import { MemberRole } from '@prisma/client';

const MESSAGE_PAGE_SIZE = 50;

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

export async function getMessages(roomId: string, userId: string, cursor?: string) {
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member) throw createError('Not a member', 403);

  const messages = await prisma.message.findMany({
    where: { roomId },
    select: msgSelect,
    orderBy: { createdAt: 'desc' },
    take: MESSAGE_PAGE_SIZE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return messages.reverse();
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  content: string,
  replyToId?: string
) {
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: senderId } },
  });
  if (!member) throw createError('Not a member', 403);

  if (content.length > 3072) throw createError('Message too long (max 3KB)', 400);

  return prisma.message.create({
    data: { roomId, senderId, content, replyToId },
    select: msgSelect,
  });
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw createError('Message not found', 404);
  if (message.senderId !== userId) throw createError('Cannot edit others messages', 403);
  if (content.length > 3072) throw createError('Message too long', 400);

  return prisma.message.update({
    where: { id: messageId },
    data: { content, isEdited: true },
    select: msgSelect,
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw createError('Message not found', 404);

  if (message.senderId !== userId) {
    // Check if user is admin in the room
    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: message.roomId, userId } },
    });
    if (!member || member.role !== MemberRole.ADMIN) {
      throw createError('Not authorized to delete this message', 403);
    }
  }

  await prisma.message.delete({ where: { id: messageId } });
}
