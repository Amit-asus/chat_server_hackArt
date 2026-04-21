import { prisma } from '../../lib/prisma';
import { createError } from '../../common/middleware/error.middleware';
import { MemberRole, RoomVisibility } from '@prisma/client';

const roomSelect = {
  id: true, name: true, description: true, visibility: true,
  ownerId: true, isDirect: true, createdAt: true,
  _count: { select: { members: true } },
};

export async function createRoom(
  ownerId: string,
  name: string,
  description: string | undefined,
  visibility: RoomVisibility
) {
  const existing = await prisma.room.findUnique({ where: { name } });
  if (existing) throw createError('Room name already taken', 409);

  return prisma.room.create({
    data: {
      name, description, visibility, ownerId,
      members: { create: { userId: ownerId, role: MemberRole.ADMIN } },
    },
    select: roomSelect,
  });
}

export async function getPublicRooms(search?: string) {
  return prisma.room.findMany({
    where: {
      visibility: RoomVisibility.PUBLIC,
      isDirect: false,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    select: roomSelect,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserRooms(userId: string) {
  const memberships = await prisma.roomMember.findMany({
    where: { userId },
    include: {
      room: { select: roomSelect },
    },
  });
  return memberships.map(m => ({ ...m.room, role: m.role }));
}

export async function getRoomById(roomId: string, userId: string) {
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member) throw createError('Not a member of this room', 403);

  return prisma.room.findUnique({
    where: { id: roomId },
    select: {
      ...roomSelect,
      members: {
        include: { user: { select: { id: true, username: true } } },
      },
    },
  });
}

export async function joinRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError('Room not found', 404);
  if (room.visibility === RoomVisibility.PRIVATE) throw createError('Room is private', 403);

  const ban = await prisma.roomBan.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (ban) throw createError('You are banned from this room', 403);

  const existing = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (existing) throw createError('Already a member', 400);

  await prisma.roomMember.create({ data: { roomId, userId } });
  return prisma.room.findUnique({ where: { id: roomId }, select: roomSelect });
}

export async function leaveRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError('Room not found', 404);
  if (room.ownerId === userId) throw createError('Owner cannot leave. Delete the room instead.', 400);

  await prisma.roomMember.delete({
    where: { roomId_userId: { roomId, userId } },
  });
}

export async function deleteRoom(roomId: string, userId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError('Room not found', 404);
  if (room.ownerId !== userId) throw createError('Only the owner can delete the room', 403);

  await prisma.room.delete({ where: { id: roomId } });
}

export async function updateRoom(
  roomId: string,
  userId: string,
  data: { name?: string; description?: string; visibility?: RoomVisibility }
) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError('Room not found', 404);
  if (room.ownerId !== userId) throw createError('Only the owner can update the room', 403);

  if (data.name && data.name !== room.name) {
    const existing = await prisma.room.findUnique({ where: { name: data.name } });
    if (existing) throw createError('Room name already taken', 409);
  }

  return prisma.room.update({ where: { id: roomId }, data, select: roomSelect });
}

export async function getRoomMembers(roomId: string, userId: string) {
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member) throw createError('Not a member', 403);

  return prisma.roomMember.findMany({
    where: { roomId },
    include: { user: { select: { id: true, username: true } } },
  });
}

export async function banMember(roomId: string, targetUserId: string, adminId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError('Room not found', 404);

  const admin = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: adminId } },
  });
  if (!admin || admin.role !== MemberRole.ADMIN) throw createError('Not authorized', 403);
  if (room.ownerId === targetUserId) throw createError('Cannot ban the owner', 400);

  await prisma.$transaction([
    prisma.roomMember.deleteMany({ where: { roomId, userId: targetUserId } }),
    prisma.roomBan.upsert({
      where: { roomId_userId: { roomId, userId: targetUserId } },
      create: { roomId, userId: targetUserId, bannedById: adminId },
      update: { bannedById: adminId },
    }),
  ]);
}

export async function unbanMember(roomId: string, targetUserId: string, adminId: string) {
  const admin = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: adminId } },
  });
  if (!admin || admin.role !== MemberRole.ADMIN) throw createError('Not authorized', 403);

  await prisma.roomBan.delete({
    where: { roomId_userId: { roomId, userId: targetUserId } },
  });
}

export async function getBannedUsers(roomId: string, adminId: string) {
  const admin = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: adminId } },
  });
  if (!admin || admin.role !== MemberRole.ADMIN) throw createError('Not authorized', 403);

  return prisma.roomBan.findMany({
    where: { roomId },
    include: {
      user: { select: { id: true, username: true } },
      bannedBy: { select: { id: true, username: true } },
    },
  });
}

export async function makeAdmin(roomId: string, targetUserId: string, ownerId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.ownerId !== ownerId) throw createError('Only owner can manage admins', 403);

  await prisma.roomMember.update({
    where: { roomId_userId: { roomId, userId: targetUserId } },
    data: { role: MemberRole.ADMIN },
  });
}

export async function removeAdmin(roomId: string, targetUserId: string, ownerId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.ownerId !== ownerId) throw createError('Only owner can manage admins', 403);
  if (targetUserId === ownerId) throw createError('Cannot remove owner admin rights', 400);

  await prisma.roomMember.update({
    where: { roomId_userId: { roomId, userId: targetUserId } },
    data: { role: MemberRole.MEMBER },
  });
}

export async function removeMember(roomId: string, targetUserId: string, adminId: string) {
  await banMember(roomId, targetUserId, adminId);
}

export async function inviteUser(roomId: string, inviterId: string, inviteeUsername: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw createError('Room not found', 404);

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: inviterId } },
  });
  if (!member) throw createError('Not a member', 403);

  const invitee = await prisma.user.findUnique({ where: { username: inviteeUsername } });
  if (!invitee) throw createError('User not found', 404);

  // Check if already banned
  const ban = await prisma.roomBan.findUnique({
    where: { roomId_userId: { roomId, userId: invitee.id } },
  });
  if (ban) throw createError('User is banned from this room', 400);

  // If public room, just add them
  if (room.visibility === RoomVisibility.PUBLIC) {
    const existing = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: invitee.id } },
    });
    if (!existing) {
      await prisma.roomMember.create({ data: { roomId, userId: invitee.id } });
    }
    return;
  }

  await prisma.roomInvitation.upsert({
    where: { roomId_inviteeId: { roomId, inviteeId: invitee.id } },
    create: { roomId, inviterId, inviteeId: invitee.id },
    update: {},
  });

  return invitee;
}

export async function acceptInvitation(invitationId: string, userId: string) {
  const invitation = await prisma.roomInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.inviteeId !== userId) throw createError('Invitation not found', 404);

  await prisma.$transaction([
    prisma.roomMember.upsert({
      where: { roomId_userId: { roomId: invitation.roomId, userId } },
      create: { roomId: invitation.roomId, userId },
      update: {},
    }),
    prisma.roomInvitation.delete({ where: { id: invitationId } }),
  ]);

  return prisma.room.findUnique({ where: { id: invitation.roomId }, select: roomSelect });
}

export async function getPendingInvitations(userId: string) {
  return prisma.roomInvitation.findMany({
    where: { inviteeId: userId },
    include: {
      room: { select: { id: true, name: true, description: true } },
      inviter: { select: { id: true, username: true } },
    },
  });
}

// Creates or gets a DM room between two users
export async function getOrCreateDM(userId1: string, userId2: string) {
  // DM rooms have a deterministic name
  const [a, b] = [userId1, userId2].sort();
  const dmName = `dm:${a}:${b}`;

  const existing = await prisma.room.findUnique({ where: { name: dmName } });
  if (existing) return existing;

  return prisma.room.create({
    data: {
      name: dmName,
      visibility: RoomVisibility.PRIVATE,
      ownerId: userId1,
      isDirect: true,
      members: {
        create: [
          { userId: userId1, role: MemberRole.MEMBER },
          { userId: userId2, role: MemberRole.MEMBER },
        ],
      },
    },
    select: roomSelect,
  });
}
