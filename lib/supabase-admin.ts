import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * 
 * This client uses the service_role key which bypasses RLS policies.
 * 
 * ⚠️ SECURITY WARNING:
 * - ONLY use this client in API routes (server-side)
 * - NEVER expose service_role key to client-side
 * - NEVER commit service_role key to Git
 * 
 * Environment Variable Required:
 * - SUPABASE_SERVICE_ROLE_KEY (server-side only)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate environment variables
const isConfigValid = 
  supabaseUrl && 
  serviceRoleKey &&
  supabaseUrl !== 'your_supabase_url_here' &&
  serviceRoleKey !== 'your_service_role_key_here' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://') &&
  serviceRoleKey.startsWith('eyJ');

if (!isConfigValid) {
  if (typeof window === 'undefined') {
    // Server-side only - log error
    console.error('❌ Supabase Admin configuration error!');
    console.error('📝 Please check your environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL should be your Supabase project URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY should be your service_role key');
    console.error('   - Both should start with https:// and eyJ respectively');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY should NEVER be exposed to client-side');
  }
}

// Create admin client with service_role key
// This bypasses RLS policies - use with caution!
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Type guard to check if admin client is properly configured
export function isAdminClientValid(): boolean {
  return isConfigValid;
}

