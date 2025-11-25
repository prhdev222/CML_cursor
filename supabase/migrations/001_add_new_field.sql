-- ============================================================================
-- Migration: Add new field example
-- ============================================================================
-- ตัวอย่างการสร้าง migration สำหรับเพิ่ม field ใหม่
-- Version: 1.0.1
-- ============================================================================

-- Add new column to patients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE patients ADD COLUMN phone_number VARCHAR(20);
    RAISE NOTICE 'Column phone_number added to patients table';
  ELSE
    RAISE NOTICE 'Column phone_number already exists';
  END IF;
END $$;

-- Create index for new column
CREATE INDEX IF NOT EXISTS idx_patients_phone_number ON patients(phone_number);

-- Update schema version
INSERT INTO schema_migrations (version, description) 
VALUES ('1.0.1', 'Add phone_number to patients table')
ON CONFLICT (version) DO NOTHING;



