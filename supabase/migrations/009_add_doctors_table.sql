-- Migration: Add doctors table for doctor management
-- Run this SQL in your Supabase SQL Editor

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_code VARCHAR(50) UNIQUE NOT NULL, -- รหัส doctor
  name VARCHAR(255) NOT NULL, -- ชื่อ doctor
  password_hash VARCHAR(255) NOT NULL, -- รหัสผ่าน (hashed)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctors_doctor_code ON doctors(doctor_code);
CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;

-- Create policy (adjust based on your authentication setup)
CREATE POLICY "Allow all operations on doctors" ON doctors
  FOR ALL USING (true) WITH CHECK (true);


