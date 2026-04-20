import { create } from 'zustand';
import { Room, Message } from '../types';

interface ChatState {
  activeRoom: Room | null;
  messages: Record<string, Message[]>;
  replyTo: Message | null;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, string[]>; // roomId -> usernames

  setActiveRoom: (room: Room | null) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  prependMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string, roomId: string) => void;
  setReplyTo: (message: Message | null) => void;
  markRead: (roomId: string) => void;
  incrementUnread: (roomId: string) => void;
  setTyping: (roomId: string, username: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeRoom: null,
  messages: {},
  replyTo: null,
  unreadCounts: {},
  typingUsers: {},

  setActiveRoom: (room) => set({ activeRoom: room }),

  setMessages: (roomId, messages) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: messages } })),

  prependMessages: (roomId, messages) =>
    set((s) => ({
      messages: { ...s.messages, [roomId]: [...messages, ...(s.messages[roomId] || [])] },
    })),

  addMessage: (message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [message.roomId]: [...(s.messages[message.roomId] || []), message],
      },
    })),

  updateMessage: (message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [message.roomId]: (s.messages[message.roomId] || []).map((m) =>
          m.id === message.id ? message : m
        ),
      },
    })),

  removeMessage: (messageId, roomId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] || []).filter((m) => m.id !== messageId),
      },
    })),

  setReplyTo: (message) => set({ replyTo: message }),

  markRead: (roomId) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [roomId]: 0 } })),

  incrementUnread: (roomId) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [roomId]: (s.unreadCounts[roomId] || 0) + 1 },
    })),

  setTyping: (roomId, username, isTyping) =>
    set((s) => {
      const current = s.typingUsers[roomId] || [];
      const updated = isTyping
        ? current.includes(username) ? current : [...current, username]
        : current.filter((u) => u !== username);
      return { typingUsers: { ...s.typingUsers, [roomId]: updated } };
    }),
}));
