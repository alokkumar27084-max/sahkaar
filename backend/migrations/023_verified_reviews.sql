-- Add verification fields to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
