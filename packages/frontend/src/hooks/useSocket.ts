import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../socket';
import { useAuthStore } from '../stores/auth.store';
import { useChatStore } from '../stores/chat.store';
import { usePresenceStore } from '../stores/presence.store';
import { Message } from '../types';

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const { addMessage, updateMessage, removeMessage, setTyping, activeRoom, incrementUnread } = useChatStore();
  const { setPresence } = usePresenceStore();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('message:new', (message: Message) => {
      addMessage(message);
      // Increment unread if not in that room
      if (activeRoom?.id !== message.roomId) {
        incrementUnread(message.roomId);
      }
    });

    socket.on('message:updated', (message: Message) => {
      updateMessage(message);
    });

    socket.on('message:deleted', ({ messageId, roomId }: { messageId: string; roomId: string }) => {
      removeMessage(messageId, roomId);
    });

    socket.on('presence:update', ({ userId, status }: { userId: string; status: 'online' | 'afk' | 'offline' }) => {
      setPresence(userId, status);
    });

    socket.on('typing:start', ({ userId, roomId }: { userId: string; roomId: string }) => {
      setTyping(roomId, userId, true);
    });

    socket.on('typing:stop', ({ userId, roomId }: { userId: string; roomId: string }) => {
      setTyping(roomId, userId, false);
    });

    // Send heartbeat every 30s
    heartbeatRef.current = setInterval(() => {
      socket.emit('heartbeat');
    }, 30000);

    // Activity tracking
    const onActivity = () => socket.emit('activity');
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);

    return () => {
      socket.off('message:new');
      socket.off('message:updated');
      socket.off('message:deleted');
      socket.off('presence:update');
      socket.off('typing:start');
      socket.off('typing:stop');
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      disconnectSocket();
    };
  }, [token]);

  return getSocket();
}
