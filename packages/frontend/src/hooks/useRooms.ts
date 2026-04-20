import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Room, RoomMember } from '../types';

export function useMyRooms() {
  return useQuery<Room[]>({
    queryKey: ['rooms', 'mine'],
    queryFn: async () => {
      const res = await api.get('/rooms/mine');
      return res.data.rooms;
    },
  });
}

export function usePublicRooms(search?: string) {
  return useQuery<Room[]>({
    queryKey: ['rooms', 'public', search],
    queryFn: async () => {
      const res = await api.get('/rooms/public', { params: { search } });
      return res.data.rooms;
    },
  });
}

export function useRoomMembers(roomId: string | undefined) {
  return useQuery<RoomMember[]>({
    queryKey: ['rooms', roomId, 'members'],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}/members`);
      return res.data.members;
    },
    enabled: !!roomId,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; visibility: string }) => {
      const res = await api.post('/rooms', data);
      return res.data.room as Room;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useJoinRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      const res = await api.post(`/rooms/${roomId}/join`);
      return res.data.room as Room;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useLeaveRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      await api.post(`/rooms/${roomId}/leave`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => {
      await api.delete(`/rooms/${roomId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function usePendingInvitations() {
  return useQuery({
    queryKey: ['rooms', 'invitations'],
    queryFn: async () => {
      const res = await api.get('/rooms/invitations');
      return res.data.invitations;
    },
  });
}
