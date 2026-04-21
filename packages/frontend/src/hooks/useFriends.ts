import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Friend, FriendRequest } from '../types';

export function useFriends() {
  return useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await api.get('/friends');
      return res.data.friends;
    },
  });
}

export function useFriendRequests() {
  return useQuery<FriendRequest[]>({
    queryKey: ['friends', 'requests'],
    queryFn: async () => {
      const res = await api.get('/friends/requests');
      return res.data.requests;
    },
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { username: string; message?: string }) => {
      const res = await api.post('/friends/request', data);
      return res.data.request;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/friends/request/${requestId}/accept`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      await api.post(`/friends/request/${requestId}/decline`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends', 'requests'] }),
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      await api.delete(`/friends/${friendId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useUserSearch(q: string) {
  return useQuery<{ id: string; username: string }[]>({
    queryKey: ['users', 'search', q],
    queryFn: async () => {
      const res = await api.get('/users/search', { params: { q } });
      return res.data.users ?? [];
    },
  });
}
