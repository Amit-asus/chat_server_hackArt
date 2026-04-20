import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../common/utils/jwt';
import { createError } from '../../common/middleware/error.middleware';

const SALT_ROUNDS = 12;

export async function register(email: string, username: string, password: string) {
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw createError('Email already in use', 409);

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) throw createError('Username already taken', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true, createdAt: true },
  });

  return user;
}

export async function login(email: string, password: string, ip?: string, browserInfo?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError('Invalid credentials', 401);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: '',
      ip,
      browserInfo,
      expiresAt,
    },
  });

  const token = signToken({ userId: user.id, sessionId: session.id });

  await prisma.session.update({
    where: { id: session.id },
    data: { token },
  });

  return {
    token,
    user: { id: user.id, email: user.email, username: user.username },
  };
}

export async function logout(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } });
}

export async function getSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    select: { id: true, browserInfo: true, ip: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeSession(sessionId: string, userId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== userId) throw createError('Session not found', 404);
  await prisma.session.delete({ where: { id: sessionId } });
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404);

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) throw createError('Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function deleteAccount(userId: string) {
  // Cascade deletes owned rooms (and their messages/files via DB cascade)
  await prisma.user.delete({ where: { id: userId } });
}
