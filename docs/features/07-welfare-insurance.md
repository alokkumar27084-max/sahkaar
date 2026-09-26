# Worker Welfare & Insurance — full product page

Purpose
-------
Worker welfare integration ensures a portion of booking revenue contributes to cooperative welfare funds and tracks insurance coverage.

What it contains
----------------
- Automatic nominal deductions per booking into a welfare corpus
- Insurance policy references on worker profiles
- Welfare reporting for societies (contributions per period)

Backend pointers
----------------
- Welfare computations are applied in booking post-processing services. Look for `welfare` or `benefits` in `backend/src/services`.

Design & images
---------------
- A simple worker profile screenshot showing welfare & insurance badges helps reviewers understand this feature.

How to test
-----------
- Create a booking and inspect the backend booking record for welfare contribution metadata. Confirm reporting endpoints show aggregated contributions.

