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
      username: { contains: query, mode: 'insensitive' },
      id: { not: excludeUserId },
    },
    select: { id: true, username: true },
    take: 20,
  });
}
