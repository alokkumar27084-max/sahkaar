# Geo-dispatch & Maps — full product page

Purpose
-------
Geo-dispatch matches demand to the nearest available worker and makes location selection simple for customers.

What it contains
----------------
- Location selector modal (search by locality or auto-detect via GPS)
- Split-map listing (results + map) and single-map views
- Distance-based ranking and filter radius controls

Frontend pointers
-----------------
- Location modal & selector: `src/components/common/LocationSelectorModal.jsx`
- Search & split-map: `src/pages/customer/SearchPage.jsx`
- Map components: `src/components/map/*` using `@react-google-maps/api`

Backend pointers
----------------
- Contractor profiles include geolocation fields; DB supports indexes for proximity queries (see migrations in `backend/migrations`).
- Search endpoints: `GET /api/contractors/search`

Design & images
---------------
- Include screenshots showing the location modal and split-map listing (you provided good examples).

How to test
-----------
- Use the location selector to pick a locality and set a search radius. Confirm the split-map and list reflect nearby verified workers.

