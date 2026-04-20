# ChatApp — CLAUDE.md

## Project Overview
Full-stack online chat application. Classic web chat with rooms, DMs, friends, file uploads, and real-time presence.

## Tech Stack
| Layer | Choice |
|---|---|
| Backend | Node.js 20 + Express 4 + TypeScript 5 |
| Real-time | Socket.IO 4 |
| Database | PostgreSQL 16 + Prisma 5 |
| Cache/Presence | Redis 7 |
| Auth | JWT (httpOnly cookies) + bcrypt |
| File uploads | Multer → local filesystem |
| Frontend | React 18 + Vite 5 + TypeScript |
| Styling | Tailwind CSS 3 + shadcn/ui |
| State | Zustand (UI) + TanStack Query (server) |

## Project Structure
```
chat_server/
├── docker-compose.yml
├── .env
├── packages/
│   ├── backend/
│   │   ├── prisma/schema.prisma
│   │   └── src/
│   │       ├── modules/       ← auth, users, rooms, messages, friends, uploads, presence
│   │       ├── common/        ← middleware, utils
│   │       ├── socket/        ← Socket.IO handlers
│   │       ├── config/env.ts
│   │       ├── lib/           ← prisma.ts, redis.ts
│   │       ├── app.ts
│   │       └── index.ts
│   └── frontend/
│       └── src/
│           ├── components/    ← layout, chat, rooms, contacts
│           ├── pages/         ← LoginPage, RegisterPage, ChatPage
│           ├── stores/        ← auth, chat, presence (Zustand)
│           ├── hooks/         ← useRooms, useMessages, useFriends, useSocket
│           ├── socket/        ← Socket.IO client
│           └── types/
└── uploads/
    ├── images/
    └── files/
```

## Running the Project
```bash
docker compose up --build
```
- Frontend: http://localhost
- Backend API: http://localhost:4000/api

## Key Architecture Decisions
- **DM rooms**: Personal messages use a special room with `isDirect=true` and name `dm:{userId1}:{userId2}` (sorted)
- **Presence**: Redis tracks per-tab activity. AFK if all tabs idle > 1 minute. Offline when all tabs disconnect.
- **File access**: Files served via `/api/uploads/:type/:filename` — access checked against room membership at request time
- **Room ban = remove**: Removing a member via admin action creates a ban entry (cannot rejoin)
- **Socket auth**: JWT verified on Socket.IO handshake, same token as REST

## API Routes
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
GET    /api/auth/sessions
DELETE /api/auth/sessions/:id
PUT    /api/auth/password
DELETE /api/auth/account

GET    /api/rooms/public?search=
GET    /api/rooms/mine
POST   /api/rooms
GET    /api/rooms/:id
PUT    /api/rooms/:id
DELETE /api/rooms/:id
POST   /api/rooms/:id/join
POST   /api/rooms/:id/leave
GET    /api/rooms/:id/members
GET    /api/rooms/:id/banned
POST   /api/rooms/:id/ban/:userId
DELETE /api/rooms/:id/ban/:userId
POST   /api/rooms/:id/admin/:userId
DELETE /api/rooms/:id/admin/:userId
POST   /api/rooms/:id/invite
POST   /api/rooms/dm/:targetUserId

GET    /api/messages/room/:roomId?cursor=
POST   /api/messages/room/:roomId
PUT    /api/messages/:id
DELETE /api/messages/:id

GET    /api/friends
GET    /api/friends/requests
POST   /api/friends/request
POST   /api/friends/request/:id/accept
POST   /api/friends/request/:id/decline
DELETE /api/friends/:friendId
POST   /api/friends/ban
DELETE /api/friends/ban/:bannedId

POST   /api/uploads/image/:roomId
POST   /api/uploads/file/:roomId
GET    /api/uploads/:type/:filename

GET    /api/users/search?q=
GET    /api/users/:username
```

## Socket.IO Events
**Client → Server:**
- `message:send` `{ roomId, content, replyToId? }`
- `message:edit` `{ messageId, content }`
- `message:delete` `{ messageId, roomId }`
- `room:join` roomId
- `room:leave` roomId
- `typing:start` roomId
- `typing:stop` roomId
- `heartbeat`
- `activity`

**Server → Client:**
- `message:new` Message
- `message:updated` Message
- `message:deleted` `{ messageId, roomId }`
- `presence:update` `{ userId, status }`
- `typing:start` `{ userId, roomId }`
- `typing:stop` `{ userId, roomId }`

## Coding Conventions
- TypeScript strict mode everywhere
- Service layer holds business logic — routes just call services
- Comments only on non-obvious logic
- Zod for validation on frontend forms
- express-validator for backend route validation
- All async route handlers wrapped in try/catch → next(err)
