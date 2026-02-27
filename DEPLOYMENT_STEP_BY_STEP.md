Deployment Step-by-step (Railway backend + Vercel frontend)

Overview
- Backend: deploy to Railway (Node.js). Root folder: `backend/`.
- Frontend: deploy to Vercel (React). Root folder: `thekedaar-frontend/`.
- Database: Supabase (managed Postgres) or any Postgres instance.

Pre-deploy checklist (local)
1. Ensure Node.js v20+ is installed: `node --version`
2. Ensure Git repository is up-to-date and pushed to GitHub.
3. Ensure you have Supabase project (or Postgres) and credentials.
4. Ensure you have Vercel and Railway (or preferred hosts) accounts.

Create/verify production DB and run migrations
1. Create Supabase project and note the connection string (transaction pooler URI).
2. In Supabase dashboard: Database → Connection pooler → copy the URI (Transaction pooler / URI).
3. On your machine (local safe run):

```bash
# in repository root
cd thekedaar-frontend/backend
# set env vars locally (do NOT commit)
cp .env.example .env
# edit .env and set DATABASE_URL to your Supabase URI, set DB_SSL=true
# then run migrations
npm install
npm run migrate:all
```

If `npm run migrate:all` hangs or errors in this environment, run each SQL file in Supabase SQL editor instead (paste files in `backend/migrations/` in order).

Railway backend deploy (step-by-step)
1. Push repo to GitHub (done).
2. Visit Railway → New Project → Deploy from GitHub → select `thekedaar` repo → choose `backend/` as root.
3. Set Start Command: `npm start` (binds to `process.env.PORT`).
4. Add environment variables (copy from `backend/.env.example`):
   - `DATABASE_URL` (Supabase connection string)
   - `DB_SSL=true`
   - `JWT_SECRET` (strong random string)
   - `JWT_EXPIRES_IN=7d`
   - `FRONTEND_URL` (e.g., `https://your-vercel-domain`)
   - `COOKIE_SECURE=true`
   - `COOKIE_SAMESITE=none`
   - `MSG91_*` keys if you need OTP via SMS
   - `CLOUDINARY_*` keys if you use Cloudinary for uploads
5. Deploy. After deployment completes, run migrations from Railway one-off shell (or locally against PROD DB):

```bash
cd backend
npm install
npm run migrate:all
```

Vercel frontend deploy (step-by-step)
1. Go to Vercel → Import Project → select `thekedaar` repo → set Root Directory: `thekedaar-frontend/`.
2. Build Command: `npm run build`
3. Output Directory: `build`
4. Environment variables (Project Settings → Environment Variables):
   - `REACT_APP_API_URL=https://<your-backend-domain>/api`
   - `REACT_APP_GA4_ID` (optional)
5. Deploy and monitor build logs.

CORS & Cookies considerations
- Backend `FRONTEND_URL` must exactly match the Vercel origin (no trailing `/`).
- For cross-site cookies (frontend and backend on different top-level domains):
  - Backend env: `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`.
  - Frontend axios: `withCredentials: true` (already configured in `src/services/api.js`).
  - Backend must respond with `Access-Control-Allow-Credentials: true` and allow the frontend origin. (Already implemented.)

Post-deploy smoke tests
Run these (replace `<backend>` with your deployed domain):

```bash
curl -i https://<backend>/health
curl -i -c /tmp/cookies -b /tmp/cookies https://<backend>/api/auth/me
curl -i https://<backend>/api/contractors/featured
```

Browser checks
- Open your frontend URL.
- Ensure Home → Search → Profile loads successfully.
- Try Register/Login flows and confirm cookie set and subsequent calls to `/api/auth/me` return user data.

If anything fails
- Check backend logs on Railway for stack traces.
- Check network tab in browser DevTools for CORS/preflight errors and cookie headers.
- For DB errors, run the SQL in Supabase SQL editor to see exact SQL error lines.

Optional: Add automatic smoke-test
- I can add `scripts/smoke-test.sh` and a GitHub Action to run smoke tests after deploy.

Security reminder
- Rotate any keys that were exposed.
- Keep `.env` in `.gitignore` (already present).

If you want, I will:
- Add `scripts/smoke-test.sh` and `package.json` script `smoke`.
- Add a GitHub Action workflow to run smoke tests after deployment.
