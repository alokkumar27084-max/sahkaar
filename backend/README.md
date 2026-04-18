# Thekedaar Backend

## Quick Start
```bash
cd backend
npm install
cp .env.example .env
npm run migrate:all
npm run dev
```

Server default: `http://localhost:5000`

Recommended (new shell):
```bash
npm test
```

## Key Routes
- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `POST /api/auth/otp/email/request`
- `POST /api/auth/otp/email/verify`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/contractors/search`
- `GET /api/contractors/featured`
- `GET /api/contractors/:id`
- `GET /api/contractors/me`
- `PUT /api/contractors/me`
- `PATCH /api/contractors/me/availability`
- `POST /api/contractors/photo`
- `POST /api/contractors/portfolio`
- `PUT /api/contractors/portfolio`
- `GET /api/reviews/contractor/:id`
- `POST /api/reviews/contractor/:id`
- `GET /api/admin/contractors/pending` (admin)
- `PATCH /api/admin/contractors/:id/verify` (admin)
- `GET /api/admin/stats` (admin)
- `GET /api/admin/reports` (admin)
- `PATCH /api/admin/reports/:id` (admin)

## Notes
- Uploads are stored in `backend/uploads/` for local development.
- JWT auth supports cookie and `Authorization: Bearer <token>`.
- Ensure `FRONTEND_URL` is set correctly for CORS.
- Production startup validates critical env vars via `src/config/validateEnv.js`.
- Public registration is restricted to `customer` and `contractor` roles only.
