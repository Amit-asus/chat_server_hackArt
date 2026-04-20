import { prisma } from '../../lib/prisma';
import { createError } from '../../common/middleware/error.middleware';
import { FriendshipStatus } from '@prisma/client';

export async function sendFriendRequest(requesterId: string, addresseeUsername: string, message?: string) {
  const addressee = await prisma.user.findUnique({ where: { username: addresseeUsername } });
  if (!addressee) throw createError('User not found', 404);
  if (addressee.id === requesterId) throw createError('Cannot add yourself', 400);

  // Check ban
  const ban = await prisma.userBan.findUnique({
    where: { bannerId_bannedId: { bannerId: addressee.id, bannedId: requesterId } },
  });
  if (ban) throw createError('Cannot send request to this user', 403);

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: requesterId },
      ],
    },
  });
  if (existing) throw createError('Friend request already exists or already friends', 400);

  return prisma.friendship.create({
    data: { requesterId, addresseeId: addressee.id, message },
    include: {
      addressee: { select: { id: true, username: true } },
    },
  });
}

export async function respondToRequest(friendshipId: string, userId: string, accept: boolean) {
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.addresseeId !== userId) throw createError('Request not found', 404);
  if (friendship.status !== FriendshipStatus.PENDING) throw createError('Request already handled', 400);

  if (!accept) {
    await prisma.friendship.delete({ where: { id: friendshipId } });
    return null;
  }

  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: FriendshipStatus.ACCEPTED },
    include: {
      requester: { select: { id: true, username: true } },
      addressee: { select: { id: true, username: true } },
    },
  });
}

export async function getFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, username: true } },
      addressee: { select: { id: true, username: true } },
    },
  });

  return friendships.map(f => {
    const friend = f.requesterId === userId ? f.addressee : f.requester;
    return { friendshipId: f.id, friend };
  });
}

export async function getPendingRequests(userId: string) {
  return prisma.friendship.findMany({
    where: { addresseeId: userId, status: FriendshipStatus.PENDING },
    include: {
      requester: { select: { id: true, username: true } },
    },
  });
}

export async function removeFriend(userId: string, friendId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [
        { requesterId: userId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: userId },
      ],
    },
  });
  if (!friendship) throw createError('Not friends', 404);
  await prisma.friendship.delete({ where: { id: friendship.id } });
}

export async function banUser(bannerId: string, bannedUsername: string) {
  const banned = await prisma.user.findUnique({ where: { username: bannedUsername } });
  if (!banned) throw createError('User not found', 404);
  if (banned.id === bannerId) throw createError('Cannot ban yourself', 400);

  // Remove friendship if exists
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: bannerId, addresseeId: banned.id },
        { requesterId: banned.id, addresseeId: bannerId },
      ],
    },
  });

  await prisma.userBan.upsert({
    where: { bannerId_bannedId: { bannerId, bannedId: banned.id } },
    create: { bannerId, bannedId: banned.id },
    update: {},
  });
}

export async function unbanUser(bannerId: string, bannedId: string) {
  await prisma.userBan.delete({
    where: { bannerId_bannedId: { bannerId, bannedId } },
  });
}

export async function getBannedUsers(userId: string) {
  return prisma.userBan.findMany({
    where: { bannerId: userId },
    include: { banned: { select: { id: true, username: true } } },
  });
}

export async function canMessage(userId1: string, userId2: string): Promise<boolean> {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [
        { requesterId: userId1, addresseeId: userId2 },
        { requesterId: userId2, addresseeId: userId1 },
      ],
    },
  });
  if (!friendship) return false;

  const ban = await prisma.userBan.findFirst({
    where: {
      OR: [
        { bannerId: userId1, bannedId: userId2 },
        { bannerId: userId2, bannedId: userId1 },
      ],
    },
  });
  return !ban;
}
