-- Migration: Secure RLS Policies
-- This migration implements secure Row Level Security policies
-- Since the app uses custom authentication via API routes (not Supabase Auth),
-- we restrict direct client-side access to sensitive data
-- All sensitive data access should go through API routes that use service_role key

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

-- ============================================================================
-- SECTION 2: SENSITIVE DATA - RESTRICT ALL CLIENT ACCESS
-- ============================================================================
-- These tables contain sensitive patient/medical data
-- Client-side access is blocked - all access must go through API routes

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
-- SECTION 4: NOTES
-- ============================================================================
-- 
-- IMPORTANT SECURITY NOTES:
-- 
-- 1. All sensitive data (patients, test_results, tki_records, alerts, admins, doctors)
--    is now blocked from direct client-side access.
--
-- 2. Your API routes must use the service_role key (not anon key) to access
--    sensitive data. The service_role key bypasses RLS policies.
--
-- 3. To use service_role key in API routes:
--    - Create a server-side Supabase client with service_role key
--    - Store service_role key in environment variable (never expose to client)
--    - Use this client in your API routes only
--
-- 4. Public data (hospitals, guidelines, protocols, research, education) can
--    be accessed directly from client-side using anon key.
--
-- 5. Example API route setup:
--    ```typescript
--    // app/api/patients/route.ts
--    import { createClient } from '@supabase/supabase-js';
--    
--    const supabaseAdmin = createClient(
--      process.env.NEXT_PUBLIC_SUPABASE_URL!,
--      process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only!
--    );
--    
--    export async function GET() {
--      const { data, error } = await supabaseAdmin
--        .from('patients')
--        .select('*');
--      // ...
--    }
--    ```
--
-- 6. Make sure to add SUPABASE_SERVICE_ROLE_KEY to:
--    - .env.local (local development)
--    - Vercel Environment Variables (production)
--    - Never commit this key to Git!

