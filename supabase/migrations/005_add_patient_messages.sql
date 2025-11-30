-- Migration: Add patient_messages table for admin to manage all patient-facing text
-- Run this SQL in your Supabase SQL Editor

-- Patient Messages table (for admin to manage all text displayed to patients)
CREATE TABLE IF NOT EXISTS patient_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_key VARCHAR(100) UNIQUE NOT NULL, -- Unique key like 'patient_portal_title', 'self_care_instructions', etc.
  message_type VARCHAR(50) NOT NULL, -- 'title', 'description', 'instruction', 'error', 'info'
  category VARCHAR(100), -- 'portal', 'medication', 'test_results', 'appointment', 'general'
  content_th TEXT NOT NULL, -- Thai content
  content_en TEXT, -- English content (optional)
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_messages_key ON patient_messages(message_key);
CREATE INDEX IF NOT EXISTS idx_patient_messages_category ON patient_messages(category);
CREATE INDEX IF NOT EXISTS idx_patient_messages_type ON patient_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_patient_messages_is_active ON patient_messages(is_active);

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_patient_messages_updated_at ON patient_messages;
CREATE TRIGGER update_patient_messages_updated_at BEFORE UPDATE ON patient_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default messages (เฉพาะหัวข้อหลักที่ต้องการให้แก้ไขได้)
INSERT INTO patient_messages (message_key, message_type, category, content_th, sort_order) VALUES
-- หัวข้อหลักที่แก้ไขได้
('patient_info_title', 'title', 'portal', 'ข้อมูลส่วนตัว', 1),
('medication_title', 'title', 'medication', 'ยาที่ใช้อยู่', 2),
('medication_side_effects_label', 'title', 'medication', 'ผลข้างเคียงที่ต้องเฝ้าระวัง:', 3),
('medication_monitoring_label', 'title', 'medication', 'การติดตามผล:', 4)

ON CONFLICT (message_key) DO NOTHING;

