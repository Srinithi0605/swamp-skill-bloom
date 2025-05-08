-- Add full_name column to users table
ALTER TABLE users ADD COLUMN full_name TEXT;

-- Update existing users to use email as full_name
UPDATE users SET full_name = email WHERE full_name IS NULL; 