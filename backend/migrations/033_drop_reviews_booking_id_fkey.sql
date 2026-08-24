-- Drop foreign key constraint on booking_id in reviews table so both bookings and quick_bookings can be referenced
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;
