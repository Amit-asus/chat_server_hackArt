export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  ownerId: string;
  isDirect: boolean;
  createdAt: string;
  role?: 'MEMBER' | 'ADMIN';
  _count?: { members: number };
}

export interface Message {
  id: string;
  roomId: string;
  content?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  sender: { id: string; username: string };
  replyTo?: {
    id: string;
    content?: string;
    sender: { id: string; username: string };
  };
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  comment?: string;
}

export interface Friend {
  friendshipId: string;
  friend: { id: string; username: string };
}

export interface FriendRequest {
  id: string;
  message?: string;
  createdAt: string;
  requester: { id: string; username: string };
}

export interface RoomMember {
  roomId: string;
  userId: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: string;
  user: { id: string; username: string };
}

export type PresenceStatus = 'online' | 'afk' | 'offline';

export interface RoomInvitation {
  id: string;
  room: { id: string; name: string; description?: string };
  inviter: { id: string; username: string };
}
