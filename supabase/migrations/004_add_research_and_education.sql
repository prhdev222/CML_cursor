-- Migration: Add research_papers and patient_education tables
-- Run this SQL in your Supabase SQL Editor

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_research_papers_is_active ON research_papers(is_active);
CREATE INDEX IF NOT EXISTS idx_research_papers_sort_order ON research_papers(sort_order);
CREATE INDEX IF NOT EXISTS idx_patient_education_category ON patient_education(category);
CREATE INDEX IF NOT EXISTS idx_patient_education_is_active ON patient_education(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_education_sort_order ON patient_education(sort_order);

-- Drop triggers if they exist (to avoid errors on re-run)
DROP TRIGGER IF EXISTS update_research_papers_updated_at ON research_papers;
DROP TRIGGER IF EXISTS update_patient_education_updated_at ON patient_education;

-- Create triggers for updated_at
CREATE TRIGGER update_research_papers_updated_at BEFORE UPDATE ON research_papers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_education_updated_at BEFORE UPDATE ON patient_education
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_education ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow all operations on research_papers" ON research_papers;
DROP POLICY IF EXISTS "Allow all operations on patient_education" ON patient_education;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on research_papers" ON research_papers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on patient_education" ON patient_education
  FOR ALL USING (true) WITH CHECK (true);

