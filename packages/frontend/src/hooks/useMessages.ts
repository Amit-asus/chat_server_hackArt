import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { Message } from '../types';

export function useMessages(roomId: string | undefined) {
  return useInfiniteQuery<Message[]>({
    queryKey: ['messages', roomId],
    queryFn: async ({ pageParam }) => {
      const res = await api.get(`/messages/room/${roomId}`, {
        params: { cursor: pageParam },
      });
      return res.data.messages;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (firstPage) => firstPage[0]?.id,
    enabled: !!roomId,
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (data: { roomId: string; content: string; replyToId?: string }) => {
      const res = await api.post(`/messages/room/${data.roomId}`, {
        content: data.content,
        replyToId: data.replyToId,
      });
      return res.data.message as Message;
    },
  });
}

export function useEditMessage() {
  return useMutation({
    mutationFn: async (data: { messageId: string; content: string }) => {
      const res = await api.put(`/messages/${data.messageId}`, { content: data.content });
      return res.data.message as Message;
    },
  });
}

export function useDeleteMessage() {
  return useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/messages/${messageId}`);
    },
  });
}
