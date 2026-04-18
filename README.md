# Thekedaar

Full-stack marketplace for connecting customers with contractors (React + Express + PostgreSQL).

## Quick start (development)

1. **PostgreSQL** — create a database and set `DATABASE_URL` in `backend/.env` (copy from `backend/.env.example`).
2. **Backend** — `cd backend && npm install && npm run migrate:all && npm run dev` (default port **5000**).
3. **Frontend** — copy `.env.example` to `.env`, set `REACT_APP_API_URL=http://localhost:5000/api`, then `npm install && npm start`.

## Documentation

- Critical path / regression scope: [docs/CRITICAL_PATH.md](docs/CRITICAL_PATH.md)
- Production deployment: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- UAT checklist: [docs/UAT_CHECKLIST.md](docs/UAT_CHECKLIST.md)
- Backend API notes: [backend/README.md](backend/README.md)

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run build` | Production frontend build |
| `npm run smoke` | HTTP smoke against running backend |
| `npm run check:release` | Release gate (build + backend load checks) |
| `npm test --prefix backend` | Backend unit tests |
| `npm run test:e2e` | Playwright E2E (requires dev server; see `playwright.config.js`) |

## Security

- Never commit `.env` files with real secrets. Use `.env.example` templates only.
- Rotate any credentials that were ever committed to git history.
