import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { initSocket } from './socket';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadsBase = path.join(process.cwd(), config.uploadsDir);
fs.mkdirSync(path.join(uploadsBase, 'images'), { recursive: true });
fs.mkdirSync(path.join(uploadsBase, 'files'), { recursive: true });

const httpServer = createServer(app);
initSocket(httpServer);

async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    await redis.connect();

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
