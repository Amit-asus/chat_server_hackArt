import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env';
import { errorMiddleware } from './common/middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import roomsRoutes from './modules/rooms/rooms.routes';
import messagesRoutes from './modules/messages/messages.routes';
import friendsRoutes from './modules/friends/friends.routes';
import uploadsRoutes from './modules/uploads/uploads.routes';

const app = express();

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files — access-controlled via API, not static
app.use('/api/uploads', uploadsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/friends', friendsRoutes);

// Serve frontend in production
if (config.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use(errorMiddleware);

export default app;
