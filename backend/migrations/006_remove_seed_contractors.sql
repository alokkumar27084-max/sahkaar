-- Remove previously-seeded demo users/contractors from older migrations.
-- Safe to run multiple times.

DELETE FROM users
WHERE phone IN (
  '9990000001',
  '9990000002',
  '9001000001',
  '9001000002',
  '9001000003',
  '9001000004',
  '9001000005'
);
