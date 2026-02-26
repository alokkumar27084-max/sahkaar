Deployment checklist — Vercel (frontend) + Railway (backend)

1) Backend (Railway / Heroku / Render)
- Root directory: backend/
- Start command: `npm start`
- Required env vars (set from `backend/.env.example`):
  - PORT (e.g. 5000)
  - DATABASE_URL
  - DB_SSL=true
  - JWT_SECRET
  - JWT_EXPIRES_IN=7d
  - FRONTEND_URL=https://your-vercel-domain
  - COOKIE_SECURE=true
  - COOKIE_SAMESITE=none
  - MSG91 keys (if using SMS)
  - CLOUDINARY_* keys (if using uploads)
- After deploy: run migrations `npm run migrate:all` or use `psql` commands from migrations/
- Ensure `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` when frontend and backend are on different top-level domains (production).

2) Frontend (Vercel)
- Root directory: thekedaar-frontend/
- Build command: `npm run build`
- Output directory: `build`
- Add env vars in project settings:
  - REACT_APP_API_URL=https://<your-backend-domain>/api
  - REACT_APP_GA4_ID (optional)
- If the frontend cannot read cookies from backend, ensure backend uses `Access-Control-Allow-Credentials: true` and that cookies use `SameSite=None; Secure`.

3) CORS & Cookies
- Backend must set `FRONTEND_URL` to the exact origin used by frontend.
- Backend `allowedHeaders` must include `X-Requested-With` (already added).
- For cross-site cookies set:
  - `COOKIE_SECURE=true` (Railway => TLS)
  - `COOKIE_SAMESITE=none`

4) Database
- Use Supabase or managed Postgres.
- Run migrations in `backend/migrations/` in order.
- Enable RLS and policies if using Supabase.

5) Post-deploy smoke tests
- GET /health
- GET /api/contractors/featured
- GET /api/auth/me (should return user:null when not logged in)
- Try register/login flows and ensure cookies are set and requests succeed.

6) Security
- Never commit real secrets. Remove any secrets in repo and rotate compromised keys.
- Add `.env` to `.gitignore` (already present).

7) Troubleshooting common issues
- CORS preflight errors: check allowed headers & origins, and ensure preflight responds with proper Access-Control-Allow-* headers.
- Cookies not set: ensure `withCredentials=true` on frontend, backend `Access-Control-Allow-Credentials: true`, and cookies set with `SameSite=None; Secure`.

If you want, I can:
- Add a small Postman / curl smoke-test script under `scripts/` to run the checks automatically.
- Add a GitHub Action that runs the smoke tests after deploy.

