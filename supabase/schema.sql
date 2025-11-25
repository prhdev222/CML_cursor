-- CML Management System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guidelines table (for admin to manage)
CREATE TABLE IF NOT EXISTS guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_th VARCHAR(255) NOT NULL,
  description_th TEXT,
  url VARCHAR(500),
  icon VARCHAR(50) DEFAULT '📋',
  organization VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research Papers table (for admin to manage)
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_th VARCHAR(500) NOT NULL,
  authors_th VARCHAR(500),
  journal_th VARCHAR(255),
  year INTEGER,
  description_th TEXT,
  url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient Education table (for admin to manage educational content)
CREATE TABLE IF NOT EXISTS patient_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL, -- 'disease_info', 'self_care', 'medication'
  title_th VARCHAR(500) NOT NULL,
  content_th TEXT NOT NULL,
  icon VARCHAR(50) DEFAULT '📚',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocols table (for admin to manage protocol content)
CREATE TABLE IF NOT EXISTS protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_type VARCHAR(50) NOT NULL, -- 'tki_switch', 'blood_test', 'bone_marrow_test'
  title_en VARCHAR(255) NOT NULL,
  title_th VARCHAR(255) NOT NULL,
  content_en TEXT NOT NULL,
  content_th TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(10) NOT NULL,
  diagnosis_date DATE NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
  current_tki VARCHAR(50),
  phase VARCHAR(20) DEFAULT 'chronic',
  sokal_score DECIMAL(5,2),
  hasford_score DECIMAL(5,2),
  elts_score DECIMAL(5,2),
  cardiovascular_risk BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TKI Records table
CREATE TABLE IF NOT EXISTS tki_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(50) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  tki_name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  reason VARCHAR(50) NOT NULL, -- 'molecularFailure' or 'intolerance'
  mutation_test_result TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test Results table
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(50) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  test_type VARCHAR(50) NOT NULL, -- 'RQ-PCR', 'CBC', 'Cytogenetic'
  test_date DATE NOT NULL,
  next_test_date DATE,
  bcr_abl_is DECIMAL(10,4), -- BCR-ABL1 IS percentage
  cbc_wbc DECIMAL(10,2),
  cbc_rbc DECIMAL(10,2),
  cbc_platelets DECIMAL(10,2),
  cbc_basophils DECIMAL(5,2),
  cbc_blasts DECIMAL(5,2),
  cytogenetic_result TEXT,
  cca_detected BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'optimal', -- 'optimal', 'warning', 'failure'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id VARCHAR(50) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(10) DEFAULT 'medium', -- 'high', 'medium', 'low'
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_tki_records_patient_id ON tki_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_results_patient_id ON test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_date ON test_results(test_date);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_id ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_guidelines_is_active ON guidelines(is_active);
CREATE INDEX IF NOT EXISTS idx_protocols_protocol_type ON protocols(protocol_type);
CREATE INDEX IF NOT EXISTS idx_protocols_is_active ON protocols(is_active);
CREATE INDEX IF NOT EXISTS idx_research_papers_is_active ON research_papers(is_active);
CREATE INDEX IF NOT EXISTS idx_research_papers_sort_order ON research_papers(sort_order);
CREATE INDEX IF NOT EXISTS idx_patient_education_category ON patient_education(category);
CREATE INDEX IF NOT EXISTS idx_patient_education_is_active ON patient_education(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_education_sort_order ON patient_education(sort_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist (to avoid errors on re-run)
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
DROP TRIGGER IF EXISTS update_hospitals_updated_at ON hospitals;
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
DROP TRIGGER IF EXISTS update_guidelines_updated_at ON guidelines;
DROP TRIGGER IF EXISTS update_protocols_updated_at ON protocols;
DROP TRIGGER IF EXISTS update_research_papers_updated_at ON research_papers;
DROP TRIGGER IF EXISTS update_patient_education_updated_at ON patient_education;

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guidelines_updated_at BEFORE UPDATE ON guidelines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at BEFORE UPDATE ON protocols
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_papers_updated_at BEFORE UPDATE ON research_papers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_education_updated_at BEFORE UPDATE ON patient_education
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tki_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_education ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
DROP POLICY IF EXISTS "Allow all operations on tki_records" ON tki_records;
DROP POLICY IF EXISTS "Allow all operations on test_results" ON test_results;
DROP POLICY IF EXISTS "Allow all operations on alerts" ON alerts;
DROP POLICY IF EXISTS "Allow all operations on hospitals" ON hospitals;
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
DROP POLICY IF EXISTS "Allow all operations on guidelines" ON guidelines;
DROP POLICY IF EXISTS "Allow all operations on protocols" ON protocols;
DROP POLICY IF EXISTS "Allow all operations on research_papers" ON research_papers;
DROP POLICY IF EXISTS "Allow all operations on patient_education" ON patient_education;

-- Create policies (adjust based on your authentication setup)
-- For now, allow all operations (you should restrict based on user roles)
CREATE POLICY "Allow all operations on patients" ON patients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tki_records" ON tki_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on test_results" ON test_results
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on alerts" ON alerts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on hospitals" ON hospitals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on admins" ON admins
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on guidelines" ON guidelines
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on protocols" ON protocols
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on research_papers" ON research_papers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on patient_education" ON patient_education
  FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt (you should use a proper hashing library in your app)
-- This is a placeholder - in production, use proper password hashing
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq')
ON CONFLICT (username) DO NOTHING;

-- Insert some default hospitals
INSERT INTO hospitals (name) VALUES 
  ('โรงพยาบาลจุฬาลงกรณ์'),
  ('โรงพยาบาลรามาธิบดี'),
  ('โรงพยาบาลศิริราช'),
  ('โรงพยาบาลสงขลานครินทร์')
ON CONFLICT (name) DO NOTHING;

