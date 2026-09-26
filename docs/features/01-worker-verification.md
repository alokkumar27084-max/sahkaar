# Worker verification — full product page

Purpose
-------
Worker verification is the trust foundation for SahKaar. The platform only lists workers who are verified by a Primary Cooperative Society and, optionally, a federation.

What it contains (for reviewers)
--------------------------------
- UI flow: Contractor registration, profile photo & document uploads, cooperative membership fields.
- Admin flow: Pending verification queue, document review, approve/deny with notes.
- Trust signals: "Verified" badge, cooperative name in profile, years of experience, ratings.

Frontend pointers
-----------------
- Registration UI: `src/pages/contractor/ContractorRegisterPage.jsx`
- Profile editor: `src/pages/contractor/ContractorEditPage.jsx`
- UI components: `src/components/contractor/*`.

Backend pointers
----------------
- API endpoints:
  - `POST /api/auth/register` (public registration)
  - `GET /api/admin/contractors/pending` (admin list)
  - `PATCH /api/admin/contractors/:id/verify` (admin verification)
- Look into `backend/openapi.yaml` for request/response examples.
- Controllers and services: `backend/src/controllers/contractorController.js`, `backend/src/services/verificationService.js` (search these names in the backend tree).

Data & migrations
-----------------
- User and contractor schema lives in `backend/migrations/` (run `npm run migrate:all` to inspect created tables).

Design & images
---------------
(Recommended) include:
- screenshot of registration form
- screenshot of admin verification list

How to test
-----------
- Register a contractor using the frontend form and check the admin pending list (requires an admin account in the DB or set ADMIN_EMAIL/ADMIN_PASSWORD to auto-create an admin).

