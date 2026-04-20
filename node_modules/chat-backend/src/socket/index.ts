import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyToken } from '../common/utils/jwt';
import { prisma } from '../lib/prisma';
import { registerTab, unregisterTab, heartbeat, getBulkPresence } from '../modules/presence/presence.service';
import { sendMessage, editMessage, deleteMessage } from '../modules/messages/messages.service';
import { v4 as uuidv4 } from 'uuid';

interface AuthSocket extends Socket {
  userId: string;
  sessionId: string;
  tabId: string;
}

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl, config.clientUrlDev],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.cookie
        ?.split(';').find((c: string) => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) return next(new Error('Unauthorized'));

      const payload = verifyToken(token);
      const session = await prisma.session.findUnique({
        where: { id: payload.sessionId, token },
      });

      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Session expired'));
      }

      (socket as AuthSocket).userId = payload.userId;
      (socket as AuthSocket).sessionId = payload.sessionId;
      (socket as AuthSocket).tabId = uuidv4();
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthSocket;
    const { userId, tabId } = socket;

    console.log(`User ${userId} connected (tab ${tabId})`);

    // Register listeners immediately so no client event is ever dropped
    // while async setup (presence, room joins) is still in flight.

    // Heartbeat — client sends every 30s
    socket.on('heartbeat', async () => {
      await heartbeat(userId, tabId);
      const presence = await getBulkPresence([userId]);
      if (presence[userId] !== 'online') {
        await broadcastPresence(io, userId, presence[userId] as 'online' | 'afk' | 'offline');
      }
    });

    // Activity ping — resets AFK timer
    socket.on('activity', async () => {
      await heartbeat(userId, tabId);
    });

    // --- MESSAGING ---
    socket.on('message:send', async (data: { roomId: string; content: string; replyToId?: string }, ack) => {
      try {
        const message = await sendMessage(data.roomId, userId, data.content, data.replyToId);
        io.to(`room:${data.roomId}`).emit('message:new', message);
        ack?.({ ok: true, message });
      } catch (err: any) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('message:edit', async (data: { messageId: string; content: string }, ack) => {
      try {
        const message = await editMessage(data.messageId, userId, data.content);
        io.to(`room:${message.roomId}`).emit('message:updated', message);
        ack?.({ ok: true, message });
      } catch (err: any) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('message:delete', async (data: { messageId: string; roomId: string }, ack) => {
      try {
        await deleteMessage(data.messageId, userId);
        io.to(`room:${data.roomId}`).emit('message:deleted', { messageId: data.messageId, roomId: data.roomId });
        ack?.({ ok: true });
      } catch (err: any) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // --- ROOM EVENTS ---
    socket.on('room:join', (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('room:leave', (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    // Typing indicators
    socket.on('typing:start', (roomId: string) => {
      socket.to(`room:${roomId}`).emit('typing:start', { userId, roomId });
    });

    socket.on('typing:stop', (roomId: string) => {
      socket.to(`room:${roomId}`).emit('typing:stop', { userId, roomId });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', async () => {
      console.log(`User ${userId} disconnected (tab ${tabId})`);
      await unregisterTab(userId, tabId);
      const presence = await getBulkPresence([userId]);
      await broadcastPresence(io, userId, presence[userId] as 'online' | 'afk' | 'offline');
    });

    // Async setup: presence + join existing rooms (runs after listeners are registered)
    (async () => {
      try {
        await registerTab(userId, tabId);
        socket.join(`user:${userId}`);

        const memberships = await prisma.roomMember.findMany({
          where: { userId },
          select: { roomId: true },
        });
        for (const { roomId } of memberships) {
          socket.join(`room:${roomId}`);
        }

        await broadcastPresence(io, userId, 'online');
      } catch (err) {
        console.error(`Socket setup error for user ${userId}:`, err);
      }
    })();
  });

  // AFK check interval — every 30 seconds
  setInterval(async () => {
    const sockets = await io.fetchSockets();
    const userIds = [...new Set(sockets.map(s => (s as any).userId as string))];
    if (userIds.length === 0) return;

    const presenceMap = await getBulkPresence(userIds);
    for (const [uid, status] of Object.entries(presenceMap)) {
      io.to(`user:${uid}`).emit('presence:self', { status });
    }
  }, 30000);

  return io;
}

async function broadcastPresence(
  io: Server,
  userId: string,
  status: 'online' | 'afk' | 'offline'
) {
  // Get user's contacts and room members to notify
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const contactIds = friendships.map(f =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );

  // Notify contacts
  for (const contactId of contactIds) {
    io.to(`user:${contactId}`).emit('presence:update', { userId, status });
  }

  // Notify room members
  const memberships = await prisma.roomMember.findMany({
    where: { userId },
    select: { roomId: true },
  });

  for (const { roomId } of memberships) {
    io.to(`room:${roomId}`).emit('presence:update', { userId, status });
  }
}
