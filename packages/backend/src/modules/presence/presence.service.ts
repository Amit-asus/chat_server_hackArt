import { redis, presenceKey, tabKey, lastActiveKey } from '../../lib/redis';
import { PresenceStatus } from '../../types';

const AFK_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function registerTab(userId: string, tabId: string) {
  await redis.sadd(tabKey(userId), tabId);
  await redis.set(lastActiveKey(userId, tabId), Date.now().toString());
  await setPresence(userId, 'online');
}

export async function unregisterTab(userId: string, tabId: string) {
  await redis.srem(tabKey(userId), tabId);
  await redis.del(lastActiveKey(userId, tabId));

  const remaining = await redis.smembers(tabKey(userId));
  if (remaining.length === 0) {
    await setPresence(userId, 'offline');
  } else {
    await recalculatePresence(userId);
  }
}

export async function heartbeat(userId: string, tabId: string) {
  await redis.set(lastActiveKey(userId, tabId), Date.now().toString());
  await recalculatePresence(userId);
}

export async function recalculatePresence(userId: string) {
  const tabs = await redis.smembers(tabKey(userId));

  if (tabs.length === 0) {
    await setPresence(userId, 'offline');
    return 'offline' as PresenceStatus;
  }

  const now = Date.now();
  let anyActive = false;

  for (const tabId of tabs) {
    const lastActive = await redis.get(lastActiveKey(userId, tabId));
    if (lastActive && now - parseInt(lastActive, 10) < AFK_THRESHOLD_MS) {
      anyActive = true;
      break;
    }
  }

  const status: PresenceStatus = anyActive ? 'online' : 'afk';
  await setPresence(userId, status);
  return status;
}

export async function setPresence(userId: string, status: PresenceStatus) {
  await redis.set(presenceKey(userId), status, 'EX', 3600);
}

export async function getPresence(userId: string): Promise<PresenceStatus> {
  const status = await redis.get(presenceKey(userId));
  return (status as PresenceStatus) || 'offline';
}

export async function getBulkPresence(userIds: string[]): Promise<Record<string, PresenceStatus>> {
  if (userIds.length === 0) return {};

  const keys = userIds.map(presenceKey);
  const values = await redis.mget(...keys);

  return userIds.reduce((acc, userId, i) => {
    acc[userId] = (values[i] as PresenceStatus) || 'offline';
    return acc;
  }, {} as Record<string, PresenceStatus>);
}
