# Ratings & Trust — full product page

Purpose
-------
Ratings and reviews create long-term trust for the platform and for cooperative societies that stand behind workers.

What it contains
----------------
- Review submission after job completion
- Contractor rating aggregated and displayed on profile
- Admin visible moderation / report mechanisms

Frontend pointers
-----------------
- Review components on contractor profile: `src/components/reviews/*`
- Submission flow tied to the booking completion handler

Backend pointers
----------------
- Review endpoints: `GET /api/reviews/contractor/:id`, `POST /api/reviews/contractor/:id`
- Stored in a `reviews` table (see `backend/migrations`)

Design & images
---------------
- Include screenshot of a contractor profile showing rating and reviews.

How to test
-----------
- Mark a booking as complete and submit a review from the customer account; verify the review appears on the contractor profile.

