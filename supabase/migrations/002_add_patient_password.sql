-- ============================================================================
-- Migration: Add password field to patients table
-- Version: 1.0.2
-- ============================================================================

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add password_hash column to patients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE patients ADD COLUMN password_hash VARCHAR(255);
    RAISE NOTICE 'Column password_hash added to patients table';
  ELSE
    RAISE NOTICE 'Column password_hash already exists';
  END IF;
END $$;

-- Add password_reset_token column for admin to reset password
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'password_reset_token'
  ) THEN
    ALTER TABLE patients ADD COLUMN password_reset_token VARCHAR(255);
    RAISE NOTICE 'Column password_reset_token added to patients table';
  ELSE
    RAISE NOTICE 'Column password_reset_token already exists';
  END IF;
END $$;

-- Add password_reset_expires column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'password_reset_expires'
  ) THEN
    ALTER TABLE patients ADD COLUMN password_reset_expires TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Column password_reset_expires added to patients table';
  ELSE
    RAISE NOTICE 'Column password_reset_expires already exists';
  END IF;
END $$;

-- Create index for password_reset_token
CREATE INDEX IF NOT EXISTS idx_patients_password_reset_token ON patients(password_reset_token);

-- Update schema version
INSERT INTO schema_migrations (version, description) 
VALUES ('1.0.2', 'Add password fields to patients table')
ON CONFLICT (version) DO NOTHING;
