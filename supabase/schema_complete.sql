-- ============================================================================
-- CML Management System - Complete Database Schema
-- ============================================================================
-- ไฟล์นี้รวมทุกอย่างไว้ในที่เดียว สำหรับ:
--   1. สร้าง database ใหม่ทั้งหมด
--   2. ย้าย database ไปยัง Supabase instance ใหม่
--   3. Reset database ทั้งหมด
--
-- คำเตือน: การรัน script นี้จะสร้างตารางใหม่ทั้งหมด
--          หากมีข้อมูลอยู่แล้ว อาจจะต้อง backup ก่อน
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: CORE TABLES
-- ============================================================================

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

-- ============================================================================
-- SECTION 2: ADMIN MANAGEMENT TABLES
-- ============================================================================

-- Guidelines table (for admin to manage)
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

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_diagnosis_date ON patients(diagnosis_date);

-- TKI Records indexes
CREATE INDEX IF NOT EXISTS idx_tki_records_patient_id ON tki_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_tki_records_start_date ON tki_records(start_date);

-- Test Results indexes
CREATE INDEX IF NOT EXISTS idx_test_results_patient_id ON test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_date ON test_results(test_date);
CREATE INDEX IF NOT EXISTS idx_test_results_test_type ON test_results(test_type);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_patient_id ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- Guidelines indexes
CREATE INDEX IF NOT EXISTS idx_guidelines_is_active ON guidelines(is_active);
CREATE INDEX IF NOT EXISTS idx_guidelines_sort_order ON guidelines(sort_order);

-- Protocols indexes
CREATE INDEX IF NOT EXISTS idx_protocols_protocol_type ON protocols(protocol_type);
CREATE INDEX IF NOT EXISTS idx_protocols_is_active ON protocols(is_active);

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_patients_updated_at 
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at 
  BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at 
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guidelines_updated_at 
  BEFORE UPDATE ON guidelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at 
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS for all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tki_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: RLS POLICIES
-- ============================================================================

-- Patients policies
DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
CREATE POLICY "Allow all operations on patients" ON patients
  FOR ALL USING (true) WITH CHECK (true);

-- TKI Records policies
DROP POLICY IF EXISTS "Allow all operations on tki_records" ON tki_records;
CREATE POLICY "Allow all operations on tki_records" ON tki_records
  FOR ALL USING (true) WITH CHECK (true);

-- Test Results policies
DROP POLICY IF EXISTS "Allow all operations on test_results" ON test_results;
CREATE POLICY "Allow all operations on test_results" ON test_results
  FOR ALL USING (true) WITH CHECK (true);

-- Alerts policies
DROP POLICY IF EXISTS "Allow all operations on alerts" ON alerts;
CREATE POLICY "Allow all operations on alerts" ON alerts
  FOR ALL USING (true) WITH CHECK (true);

-- Hospitals policies
DROP POLICY IF EXISTS "Allow all operations on hospitals" ON hospitals;
CREATE POLICY "Allow all operations on hospitals" ON hospitals
  FOR ALL USING (true) WITH CHECK (true);

-- Admins policies
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
CREATE POLICY "Allow all operations on admins" ON admins
  FOR ALL USING (true) WITH CHECK (true);

-- Guidelines policies
DROP POLICY IF EXISTS "Allow all operations on guidelines" ON guidelines;
CREATE POLICY "Allow all operations on guidelines" ON guidelines
  FOR ALL USING (true) WITH CHECK (true);

-- Protocols policies
DROP POLICY IF EXISTS "Allow all operations on protocols" ON protocols;
CREATE POLICY "Allow all operations on protocols" ON protocols
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SECTION 7: DEFAULT DATA
-- ============================================================================

-- Insert default hospitals
INSERT INTO hospitals (name) VALUES 
  ('โรงพยาบาลจุฬาลงกรณ์'),
  ('โรงพยาบาลรามาธิบดี'),
  ('โรงพยาบาลศิริราช'),
  ('โรงพยาบาลสงขลานครินทร์'),
  ('โรงพยาบาลมหาราชนครราชสีมา'),
  ('โรงพยาบาลเชียงใหม่'),
  ('โรงพยาบาลขอนแก่น'),
  ('โรงพยาบาลศรีนครินทร์')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user
-- Password: admin123
-- Note: This is a placeholder hash. You should use the API endpoint /api/admin/init
-- to create the admin user with proper bcrypt hash, or update this hash manually.
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq')
ON CONFLICT (username) DO NOTHING;

-- Insert default guidelines
INSERT INTO guidelines (title_en, title_th, description_en, description_th, url, icon, organization, sort_order) VALUES
  (
    'NCCN Guidelines',
    'แนวทาง NCCN',
    'NCCN Clinical Practice Guidelines in Oncology - Chronic Myeloid Leukemia',
    'แนวทางปฏิบัติทางคลินิก NCCN สำหรับโรคมะเร็งเม็ดเลือดขาวชนิดเรื้อรังแบบมัยอีลอยด์',
    'https://jnccn.org/abstract/journals/jnccn/22/1/article-p43.xml',
    '📋',
    'NCCN',
    1
  ),
  (
    'ELN 2020 Recommendations',
    'คำแนะนำ ELN 2020',
    'European LeukemiaNet 2020 recommendations for treating chronic myeloid leukemia',
    'คำแนะนำ European LeukemiaNet 2020 สำหรับการรักษาโรคมะเร็งเม็ดเลือดขาวชนิดเรื้อรังแบบมัยอีลอยด์',
    'https://pubmed.ncbi.nlm.nih.gov/32127639/',
    '📖',
    'ELN',
    2
  ),
  (
    'Thai Society of Hematology Guidelines',
    'แนวทางสมาคมโลหิตวิทยาประเทศไทย',
    'Thai Society of Hematology Guidelines for Chronic Myeloid Leukemia Management',
    'แนวทางสมาคมโลหิตวิทยาประเทศไทยสำหรับการจัดการโรคมะเร็งเม็ดเลือดขาวชนิดเรื้อรังแบบมัยอีลอยด์',
    'https://www.thaiclinicalguidelines.org/',
    '🏥',
    'TSH',
    3
  )
ON CONFLICT DO NOTHING;

-- Insert default protocols
INSERT INTO protocols (protocol_type, title_en, title_th, content_en, content_th, is_active) VALUES
  (
    'tki_switch',
    'TKI Switch Protocol',
    'โปรโตคอลการเปลี่ยนยา TKI',
    'Protocol for switching TKI medications based on molecular response, intolerance, or resistance.',
    'โปรโตคอลสำหรับการเปลี่ยนยาสำหรับผู้ป่วยที่มีการตอบสนองทางโมเลกุลไม่ดี ทนยาไม่ได้ หรือดื้อยา',
    true
  ),
  (
    'blood_test',
    'Blood Test Protocol',
    'โปรโตคอลการเจาะเลือด',
    'Regular blood tests including CBC and RQ-PCR for BCR-ABL1 monitoring.',
    'การเจาะเลือดเป็นประจำ รวมถึงการตรวจนับเม็ดเลือดและการตรวจ RQ-PCR สำหรับ BCR-ABL1',
    true
  ),
  (
    'bone_marrow_test',
    'Bone Marrow Test Protocol',
    'โปรโตคอลการเจาะกระดูก',
    'Bone marrow aspiration and biopsy for cytogenetic analysis.',
    'การเจาะกระดูกเพื่อการวิเคราะห์เซลล์พันธุกรรม',
    true
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- ============================================================================

-- Uncomment these queries to verify the schema after running the script

-- Verify all tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Verify hospital_id column exists in patients table
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'patients' AND column_name = 'hospital_id';

-- Count records in each table
-- SELECT 
--   'hospitals' as table_name, COUNT(*) as count FROM hospitals
-- UNION ALL
-- SELECT 'admins', COUNT(*) FROM admins
-- UNION ALL
-- SELECT 'patients', COUNT(*) FROM patients
-- UNION ALL
-- SELECT 'guidelines', COUNT(*) FROM guidelines
-- UNION ALL
-- SELECT 'protocols', COUNT(*) FROM protocols;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================



