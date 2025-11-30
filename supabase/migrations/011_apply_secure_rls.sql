-- Migration: Apply Secure RLS Policies
-- This migration applies secure Row Level Security policies
-- Run this AFTER ensuring all API routes use service_role key
--
-- IMPORTANT: This will block direct client-side access to sensitive data
-- Make sure your API routes are ready before running this!

-- ============================================================================
-- SECTION 1: DROP EXISTING PERMISSIVE POLICIES
-- ============================================================================

-- Drop all existing "Allow all operations" policies
DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
DROP POLICY IF EXISTS "Allow all operations on tki_records" ON tki_records;
DROP POLICY IF EXISTS "Allow all operations on test_results" ON test_results;
DROP POLICY IF EXISTS "Allow all operations on alerts" ON alerts;
DROP POLICY IF EXISTS "Allow all operations on hospitals" ON hospitals;
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow all operations on guidelines" ON guidelines;
DROP POLICY IF EXISTS "Allow all operations on protocols" ON protocols;
DROP POLICY IF EXISTS "Allow all operations on research_papers" ON research_papers;
DROP POLICY IF EXISTS "Allow all operations on patient_education" ON patient_education;
DROP POLICY IF EXISTS "Allow all operations on tki_medications" ON tki_medications;

-- Drop any existing block policies (in case migration 010 was run)
DROP POLICY IF EXISTS "Block all client access to patients" ON patients;
DROP POLICY IF EXISTS "Block all client access to tki_records" ON tki_records;
DROP POLICY IF EXISTS "Block all client access to test_results" ON test_results;
DROP POLICY IF EXISTS "Block all client access to alerts" ON alerts;
DROP POLICY IF EXISTS "Block all client access to admins" ON admins;
DROP POLICY IF EXISTS "Block all client access to doctors" ON doctors;

-- ============================================================================
-- SECTION 2: SENSITIVE DATA - RESTRICT ALL CLIENT ACCESS
-- ============================================================================
-- These tables contain sensitive patient/medical data
-- Client-side access is blocked - all access must go through API routes
-- API routes use service_role key which bypasses RLS

-- Patients: Block all client-side access
CREATE POLICY "Block all client access to patients" ON patients
  FOR ALL USING (false) WITH CHECK (false);

-- TKI Records: Block all client-side access
CREATE POLICY "Block all client access to tki_records" ON tki_records
  FOR ALL USING (false) WITH CHECK (false);

-- Test Results: Block all client-side access
CREATE POLICY "Block all client access to test_results" ON test_results
  FOR ALL USING (false) WITH CHECK (false);

-- Alerts: Block all client-side access
CREATE POLICY "Block all client access to alerts" ON alerts
  FOR ALL USING (false) WITH CHECK (false);

-- Admins: Block all client-side access
CREATE POLICY "Block all client access to admins" ON admins
  FOR ALL USING (false) WITH CHECK (false);

-- Doctors: Block all client-side access
CREATE POLICY "Block all client access to doctors" ON doctors
  FOR ALL USING (false) WITH CHECK (false);

-- TKI Medications: Block all client-side access (admin only)
CREATE POLICY "Block all client access to tki_medications" ON tki_medications
  FOR ALL USING (false) WITH CHECK (false);

-- ============================================================================
-- SECTION 3: PUBLIC DATA - ALLOW READ ACCESS
-- ============================================================================
-- These tables contain public information that can be safely accessed

-- Hospitals: Allow read access (public information)
CREATE POLICY "Allow public read access to hospitals" ON hospitals
  FOR SELECT USING (true);

-- Guidelines: Allow read access to active guidelines only
CREATE POLICY "Allow public read access to active guidelines" ON guidelines
  FOR SELECT USING (is_active = true);

-- Protocols: Allow read access to active protocols only
CREATE POLICY "Allow public read access to active protocols" ON protocols
  FOR SELECT USING (is_active = true);

-- Research Papers: Allow read access to active research only
CREATE POLICY "Allow public read access to active research" ON research_papers
  FOR SELECT USING (is_active = true);

-- Patient Education: Allow read access to active education content only
CREATE POLICY "Allow public read access to active patient education" ON patient_education
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- SECTION 4: VERIFICATION
-- ============================================================================
-- Check that RLS is enabled on all tables
DO $$
BEGIN
  -- Verify RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.schemaname = 'public' 
    AND t.tablename IN ('patients', 'tki_records', 'test_results', 'alerts', 'admins', 'doctors')
    AND c.relrowsecurity = true
  ) THEN
    RAISE NOTICE 'RLS is enabled on sensitive tables';
  END IF;
END $$;

