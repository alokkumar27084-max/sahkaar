# Thekedaar Deployment Guide

## 1. Deploy Backend (Railway)
1. Push repo to GitHub.
2. In Railway, create a new project from this repo.
3. Set root directory to `backend/`.
4. Start command: `npm start`.
5. Add backend env vars from `backend/.env.example`:
   - `PORT`
   - `DATABASE_URL`
   - `DB_SSL=true`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `FRONTEND_URL`
   - `COOKIE_SECURE=true`
   - MSG91 keys (if OTP SMS in production)
   - You can start from `backend/.env.production.example`

## 2. Run Migrations
After backend deploy, run:
```bash
cd backend
npm install
npm run migrate:all
```

## 3. Deploy Frontend (Vercel)
1. Import repo in Vercel.
2. Root directory: `thekedaar-frontend/`.
3. Build command: `npm run build`.
4. Output directory: `build`.
5. Add env vars:
   - `REACT_APP_API_URL=https://<your-railway-domain>/api`
   - `REACT_APP_GA4_ID=G-XXXXXXXXXX` (optional analytics)
   - You can start from `.env.production.example`

## 4. Set CORS Correctly
In Railway backend env:
- `FRONTEND_URL=https://<your-vercel-domain>`

Use exact origin, no trailing slash.

## 5. Post-Deploy Checks
1. Open backend health URL: `https://<railway>/health`.
2. Verify customer flow:
   - Home -> Search -> Profile -> WhatsApp button.
3. Verify contractor flow:
   - Register -> Dashboard -> Edit Profile -> Upload photos.
4. Verify admin flow:
   - `/admin/dashboard` with admin user.

## 6. Pre-Release Command
Run this before pushing a release:
```bash
npm run check:release
```
