# SkilliTrack — Internal Team Dashboard

A full-stack MERN app for team attendance, EOD reports, and admin oversight.

## Quick Start

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Setup .env (server/.env is already included for local dev)
For production, update MONGO_URI to your MongoDB Atlas URL.

### 3. Create admin user
```bash
cd server
node seed.js
```
Admin login: **admin@gmail.com** / **admin123**

### 4. Run (two terminals)
```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

### 5. Open
- App: http://localhost:5173
- Admin: http://localhost:5173/admin

## Deploy to Render

### Backend (Web Service)
- Root Directory: `server`
- Build: `npm install`
- Start: `node index.js`
- Env vars: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`

### Frontend (Static Site)
- Root Directory: `client`
- Build: `npm install && npm run build`
- Publish: `dist`
- Env var: `VITE_API_URL=https://YOUR-SERVER.onrender.com/api`

## Features
- Punch In / Punch Out (login = punch in)
- Live team status dashboard
- Working hours calculation
- On Leave toggle
- EOD report submission (projects / completed / planned)
- Admin panel: overview, users, attendance, EOD reports
- Responsive on mobile and desktop
