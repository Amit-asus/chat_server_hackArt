import Redis from 'ioredis';
import { config } from '../config/env';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

// Presence key helpers
export const presenceKey = (userId: string) => `presence:${userId}`;
export const tabKey = (userId: string) => `tabs:${userId}`;
export const lastActiveKey = (userId: string, tabId: string) => `lastactive:${userId}:${tabId}`;
