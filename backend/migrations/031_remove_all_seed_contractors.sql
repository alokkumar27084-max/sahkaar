-- 031_remove_all_seed_contractors.sql
-- Remove all legacy seed contractors and dummy data from the system

DO $$
BEGIN
  -- 1. Remove mock subscriptions created for seed contractors
  DELETE FROM subscriptions
  WHERE contractor_id IN (
    SELECT c.id FROM contractors c
    JOIN users u ON u.id = c.user_id
    WHERE u.email LIKE '%@thekedaar.in'
       OR u.email LIKE '%@sahkaari.in'
       OR u.phone LIKE '+9198260%'
       OR u.phone LIKE '+9198261%'
       OR u.phone LIKE '9990000%'
       OR u.phone LIKE '9001000%'
  );

  -- 2. Remove mock bookings/reviews for seed contractors
  DELETE FROM reviews
  WHERE contractor_id IN (
    SELECT c.id FROM contractors c
    JOIN users u ON u.id = c.user_id
    WHERE u.email LIKE '%@thekedaar.in'
       OR u.email LIKE '%@sahkaari.in'
       OR u.phone LIKE '+9198260%'
       OR u.phone LIKE '+9198261%'
       OR u.phone LIKE '9990000%'
       OR u.phone LIKE '9001000%'
  );

  DELETE FROM bookings
  WHERE contractor_id IN (
    SELECT c.id FROM contractors c
    JOIN users u ON u.id = c.user_id
    WHERE u.email LIKE '%@thekedaar.in'
       OR u.email LIKE '%@sahkaari.in'
       OR u.phone LIKE '+9198260%'
       OR u.phone LIKE '+9198261%'
       OR u.phone LIKE '9990000%'
       OR u.phone LIKE '9001000%'
  );

  -- 3. Delete seed contractors
  DELETE FROM contractors
  WHERE user_id IN (
    SELECT id FROM users
    WHERE email LIKE '%@thekedaar.in'
       OR email LIKE '%@sahkaari.in'
       OR phone LIKE '+9198260%'
       OR phone LIKE '+9198261%'
       OR phone LIKE '9990000%'
       OR phone LIKE '9001000%'
  );

  -- 4. Delete seed contractor users
  DELETE FROM users
  WHERE (email LIKE '%@thekedaar.in' OR email LIKE '%@sahkaari.in' OR phone LIKE '+9198260%' OR phone LIKE '+9198261%' OR phone LIKE '9990000%' OR phone LIKE '9001000%')
    AND role NOT IN ('admin', 'federation_admin', 'society_admin');

END $$;
