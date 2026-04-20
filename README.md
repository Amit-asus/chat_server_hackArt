# ChatApp — Local Setup Guide

## Prerequisites

Make sure you have these installed:

- [Git](https://git-scm.com/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

That's it — no Node.js, no PostgreSQL, no Redis needed locally. Docker handles everything.

---

## Steps

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd chat_server
```

### 2. Create the environment file

Create a file named `.env` in the root `chat_server/` folder with this content:

```env
# Database
POSTGRES_USER=chatuser
POSTGRES_PASSWORD=chatpassword
POSTGRES_DB=chatdb
DATABASE_URL=postgresql://chatuser:chatpassword@postgres:5432/chatdb

# Redis
REDIS_PASSWORD=redispassword
REDIS_URL=redis://:redispassword@redis:6379

# JWT
JWT_SECRET=super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d

# App
PORT=4000
NODE_ENV=production
CLIENT_URL=http://localhost

# Upload limits
MAX_FILE_SIZE_MB=20
MAX_IMAGE_SIZE_MB=3
```

### 3. Start the app

```bash
docker compose up --build
```

This builds and starts all services (database, cache, backend, frontend). First build takes a few minutes.

### 4. Open in browser

| Service | URL                       |
|---------|---------------------------|
| App     | http://localhost          |
| API     | http://localhost:4000/api |

---

## Stopping the app

```bash
docker compose down
```

To also delete all saved data (messages, users, uploads):

```bash
docker compose down -v
```

---

## Running Frontend & Backend Locally (without Docker)

Use this when you want to actively develop and see live changes.

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- Docker Desktop still needed **only for PostgreSQL and Redis**

### 1. Start only the database and cache

```bash
docker compose up postgres redis -d
```

### 2. Set up the backend

```bash
cd packages/backend
```

Create a `.env` file inside `packages/backend/` with:

```env
DATABASE_URL=postgresql://chatuser:chatpassword@localhost:5432/chatdb
REDIS_URL=redis://:redispassword@localhost:6379
JWT_SECRET=super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost
CLIENT_URL_DEV=http://localhost:3000
```

Then run:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Backend will be live at **http://localhost:4000**

### 3. Set up the frontend

Open a **new terminal**:

```bash
cd packages/frontend
npm install
npm run dev
```

Frontend will be live at **http://localhost:3000**

---

## Troubleshooting

**Port 80 or 4000 already in use?**
Stop any local web server or app using those ports, then try again.

**Docker not running?**
Open Docker Desktop and wait for it to fully start before running `docker compose up`.

**Changes not reflecting after a code edit?**
Rebuild with: `docker compose up --build`
