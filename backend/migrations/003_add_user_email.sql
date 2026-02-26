-- Add email column to users table for email-based login
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
