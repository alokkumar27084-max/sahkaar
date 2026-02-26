-- Add image_url column to contractors for profile images
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS image_url TEXT;
