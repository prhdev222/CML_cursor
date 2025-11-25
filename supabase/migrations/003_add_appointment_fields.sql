-- ============================================================================
-- Migration 003: Add appointment and RQ-PCR date range fields to patients
-- ============================================================================
-- Description: เพิ่มฟิลด์สำหรับจัดการนัดครั้งหน้าและช่วงเวลาที่ควรเจาะ RQ-PCR
-- Date: 2025-01-XX
-- ============================================================================

-- Create schema_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(50) PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if migration has already been applied
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '003_add_appointment_fields') THEN
    RAISE NOTICE 'Migration 003_add_appointment_fields has already been applied. Skipping...';
    RETURN;
  END IF;
END $$;

-- Add appointment and RQ-PCR date range fields to patients table
DO $$
BEGIN
  -- Add next_appointment_date if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'next_appointment_date'
  ) THEN
    ALTER TABLE patients ADD COLUMN next_appointment_date DATE;
    RAISE NOTICE 'Added column: next_appointment_date';
  END IF;

  -- Add next_appointment_notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'next_appointment_notes'
  ) THEN
    ALTER TABLE patients ADD COLUMN next_appointment_notes TEXT;
    RAISE NOTICE 'Added column: next_appointment_notes';
  END IF;

  -- Add next_rq_pcr_date_range_start if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'next_rq_pcr_date_range_start'
  ) THEN
    ALTER TABLE patients ADD COLUMN next_rq_pcr_date_range_start DATE;
    RAISE NOTICE 'Added column: next_rq_pcr_date_range_start';
  END IF;

  -- Add next_rq_pcr_date_range_end if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'next_rq_pcr_date_range_end'
  ) THEN
    ALTER TABLE patients ADD COLUMN next_rq_pcr_date_range_end DATE;
    RAISE NOTICE 'Added column: next_rq_pcr_date_range_end';
  END IF;
END $$;

-- Record migration
INSERT INTO schema_migrations (version, description)
VALUES ('003_add_appointment_fields', 'Add appointment and RQ-PCR date range fields to patients table')
ON CONFLICT (version) DO NOTHING;

-- Add comments
COMMENT ON COLUMN patients.next_appointment_date IS 'วันนัดครั้งต่อไป';
COMMENT ON COLUMN patients.next_appointment_notes IS 'หมายเหตุจากแพทย์สำหรับนัดครั้งหน้า (เช่น BM, เจาะเลือด, หัตถการอื่นๆ)';
COMMENT ON COLUMN patients.next_rq_pcr_date_range_start IS 'วันที่เริ่มต้นช่วงเวลาที่ควรเจาะ RQ-PCR for BCR-ABL';
COMMENT ON COLUMN patients.next_rq_pcr_date_range_end IS 'วันที่สิ้นสุดช่วงเวลาที่ควรเจาะ RQ-PCR for BCR-ABL';

