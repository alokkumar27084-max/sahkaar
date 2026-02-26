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

## Key Routes
- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `GET /api/auth/me`
- `POST /api/auth/logout`
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
