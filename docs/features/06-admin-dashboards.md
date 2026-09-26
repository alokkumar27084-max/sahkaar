# Admin Dashboards — full product page

Purpose
-------
Admin dashboards give cooperative societies and federation administrators the operational tools to manage workers, monitor reports, and oversee welfare funds.

What it contains
----------------
- Pending verification queue
- Operational stats and exported reports
- Worker dispute and report handling

Frontend pointers
-----------------
- Admin pages: `src/pages/admin/*`, `src/pages/admin/AdminDashboardPage.jsx`, `src/pages/admin/FederationAdminDashboard.jsx`

Backend pointers
----------------
- Admin endpoints: `GET /api/admin/stats`, `GET /api/admin/reports`, `PATCH /api/admin/reports/:id`
- Admin role checks in backend middleware (see `backend/src/config`)

Design & images
---------------
- Include screenshots of admin dashboard widgets (graphs, pending lists, KPI cards).

How to test
-----------
- Use an admin account (set ADMIN_EMAIL/ADMIN_PASSWORD), access `/admin/dashboard`, and verify approve/deny flows for contractor verification.

