import { prisma } from '../../lib/prisma';

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, createdAt: true },
  });
}

export async function searchUsers(query: string, excludeUserId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      ...(query.trim() ? { username: { contains: query.trim(), mode: 'insensitive' } } : {}),
    },
    select: { id: true, username: true },
    orderBy: { username: 'asc' },
    take: 30,
  });
}
