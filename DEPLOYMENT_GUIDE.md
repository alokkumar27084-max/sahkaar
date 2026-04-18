# Thekedaar deployment guide (single VPS)

This runbook matches `scripts/release-check.sh` and production hardening in the codebase.

## Prerequisites

- Ubuntu LTS (or similar) with SSH access
- Node.js 18 LTS
- PostgreSQL 15+ (managed or on same VPS via Docker: `backend/docker-compose.yml`)
- Domain name and DNS pointing to the VPS

## Environment

1. Copy templates and fill secrets (never commit real `.env` files):
   - Frontend: `.env.production` from [`.env.production.example`](.env.production.example)
   - Backend: `backend/.env` from [`backend/.env.production.example`](backend/.env.production.example)
2. Required backend variables (see also [`backend/src/config/validateEnv.js`](backend/src/config/validateEnv.js) for production):
   - `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
3. Align `REACT_APP_API_URL` with your public API URL (e.g. `https://api.example.com/api`).

## Database

```bash
cd backend && npm ci && npm run migrate:all
```

## Build frontend

```bash
npm ci && npm run build
```

Serve `build/` via Nginx/Caddy or the reverse proxy of your choice.

## Backend process

Use `systemd` or PM2 to run:

```bash
cd backend && NODE_ENV=production npm start
```

Ensure the process restarts on failure and logs to journald or a file with rotation.

## Reverse proxy (Nginx sketch)

- TLS termination (Let’s Encrypt)
- Proxy `/api` and WebSocket path `/socket.io` to `http://127.0.0.1:5000` (or your `PORT`)
- Serve static files from `build/` for `/`
- Set `proxy_set_header Host`, `X-Forwarded-For`, `X-Forwarded-Proto` for correct URLs and cookies

## Health checks

- `GET /health` — returns `200` when app is up; includes `db: ok` when `DATABASE_URL` is set and PostgreSQL is reachable

## Backups

- Nightly logical backup of PostgreSQL (`pg_dump`)
- Include `backend/uploads` in filesystem backups or sync to object storage

## Rollback

1. Revert deployment to previous build artifact and previous backend revision
2. Restore DB from last known-good backup if migrations or data corruption occurred

## Pre-deploy checklist

Run locally or in CI:

```bash
npm run check:release
```

Then verify `/health`, critical paths in [`docs/CRITICAL_PATH.md`](docs/CRITICAL_PATH.md), and [`docs/UAT_CHECKLIST.md`](docs/UAT_CHECKLIST.md).
