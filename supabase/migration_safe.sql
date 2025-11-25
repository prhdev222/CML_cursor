-- Migration: Add hospital_id column to patients table (SAFE VERSION)
-- This version only adds the column without dropping anything
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create hospitals table if it doesn't exist
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add hospital_id column to patients table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'hospital_id'
  ) THEN
    ALTER TABLE patients 
    ADD COLUMN hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
    
    RAISE NOTICE 'Column hospital_id added successfully';
  ELSE
    RAISE NOTICE 'Column hospital_id already exists';
  END IF;
END $$;

-- Step 3: Create other new tables if they don't exist
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en VARCHAR(255) NOT NULL,
  title_th VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_th TEXT,
  url VARCHAR(500),
  icon VARCHAR(50) DEFAULT '📋',
  organization VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_type VARCHAR(50) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_th VARCHAR(255) NOT NULL,
  content_en TEXT NOT NULL,
  content_th TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_guidelines_is_active ON guidelines(is_active);
CREATE INDEX IF NOT EXISTS idx_protocols_protocol_type ON protocols(protocol_type);
CREATE INDEX IF NOT EXISTS idx_protocols_is_active ON protocols(is_active);

-- Step 5: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Create triggers for new tables (only if they don't exist)
-- Using CREATE OR REPLACE is safer than DROP
DO $$
BEGIN
  -- Hospitals trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_hospitals_updated_at'
  ) THEN
    CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Admins trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_admins_updated_at'
  ) THEN
    CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Guidelines trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_guidelines_updated_at'
  ) THEN
    CREATE TRIGGER update_guidelines_updated_at BEFORE UPDATE ON guidelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Protocols trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_protocols_updated_at'
  ) THEN
    CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON protocols
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 7: Enable RLS for new tables (safe - only enables if not already enabled)
DO $$
BEGIN
  -- These are safe operations, they won't affect existing data
  ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
  ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
  ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN
    -- Ignore if already enabled
    NULL;
END $$;

-- Step 8: Create policies for new tables (only if they don't exist)
DO $$
BEGIN
  -- Hospitals policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hospitals' AND policyname = 'Allow all operations on hospitals'
  ) THEN
    CREATE POLICY "Allow all operations on hospitals" ON hospitals
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Admins policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admins' AND policyname = 'Allow all operations on admins'
  ) THEN
    CREATE POLICY "Allow all operations on admins" ON admins
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Guidelines policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'guidelines' AND policyname = 'Allow all operations on guidelines'
  ) THEN
    CREATE POLICY "Allow all operations on guidelines" ON guidelines
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Protocols policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'protocols' AND policyname = 'Allow all operations on protocols'
  ) THEN
    CREATE POLICY "Allow all operations on protocols" ON protocols
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Step 9: Insert default data (safe - won't duplicate)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq')
ON CONFLICT (username) DO NOTHING;

INSERT INTO hospitals (name) VALUES 
  ('โรงพยาบาลจุฬาลงกรณ์'),
  ('โรงพยาบาลรามาธิบดี'),
  ('โรงพยาบาลศิริราช'),
  ('โรงพยาบาลสงขลานครินทร์')
ON CONFLICT (name) DO NOTHING;



