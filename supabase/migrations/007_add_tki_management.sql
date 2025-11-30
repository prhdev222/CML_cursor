-- Migration: Add TKI medications management and editable labels
-- Run this SQL in your Supabase SQL Editor

-- TKI Medications table (for admin to manage medications)
CREATE TABLE IF NOT EXISTS tki_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_key VARCHAR(50) UNIQUE NOT NULL, -- 'imatinib', 'nilotinib', 'dasatinib', 'ponatinib'
  name_th VARCHAR(255) NOT NULL, -- ชื่อยาภาษาไทย
  name_en VARCHAR(255) NOT NULL, -- ชื่อยาภาษาอังกฤษ
  side_effects TEXT[] NOT NULL, -- Array of side effects
  monitoring TEXT[] NOT NULL, -- Array of monitoring instructions
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tki_medications_key ON tki_medications(medication_key);
CREATE INDEX IF NOT EXISTS idx_tki_medications_is_active ON tki_medications(is_active);

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_tki_medications_updated_at ON tki_medications;
CREATE TRIGGER update_tki_medications_updated_at BEFORE UPDATE ON tki_medications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default medications
INSERT INTO tki_medications (medication_key, name_th, name_en, side_effects, monitoring, sort_order) VALUES
('imatinib', 'Imatinib', 'Imatinib (Gleevec)', 
 ARRAY['คลื่นไส้', 'ปวดกล้ามเนื้อ', 'บวมน้ำ', 'ผื่น'],
 ARRAY['CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'ตรวจตับ'],
 1),
('nilotinib', 'Nilotinib', 'Nilotinib (Tasigna)',
 ARRAY['QT prolongation', 'ตับอักเสบ', 'ไขมันในเลือดสูง', 'ผื่น'],
 ARRAY['ECG ก่อนเริ่มยา', 'CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'ตรวจตับและไขมัน'],
 2),
('dasatinib', 'Dasatinib', 'Dasatinib (Sprycel)',
 ARRAY['น้ำในเยื่อหุ้มปอด', 'เลือดออก', 'ปวดหัว', 'คลื่นไส้'],
 ARRAY['CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'CXR ถ้ามีอาการหายใจลำบาก'],
 3),
('ponatinib', 'Ponatinib', 'Ponatinib (Iclusig)',
 ARRAY['ลิ่มเลือดอุดตัน', 'ความดันโลหิตสูง', 'ตับอักเสบ', 'ตับอ่อนอักเสบ'],
 ARRAY['CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'ตรวจความดันโลหิต', 'ตรวจหัวใจ'],
 4)

ON CONFLICT (medication_key) DO NOTHING;

