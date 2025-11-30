import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
const isConfigValid = 
  supabaseUrl && 
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.startsWith('eyJ');

// Create Supabase client
let supabase: ReturnType<typeof createClient>;

if (!isConfigValid) {
  if (typeof window !== 'undefined') {
    console.error('❌ Supabase configuration error!');
    console.error('📝 Please check your .env.local file:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL should be your Supabase project URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY should be your anon public key');
    console.error('   - Both should start with https:// and eyJ respectively');
  }
  
  // Create client with empty values (will fail gracefully)
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      auth: {
        persistSession: false,
      },
    }
  );
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
    },
  });
  
  if (typeof window !== 'undefined') {
    console.log('✅ Supabase client initialized successfully');
  }
}

export { supabase };

