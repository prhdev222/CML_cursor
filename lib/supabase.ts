import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a mock client if environment variables are not set
let supabase: ReturnType<typeof createClient>;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_URL === 'your_supabase_url_here' ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your_supabase_anon_key_here') {
  console.warn('⚠️ Supabase environment variables are not set. Using placeholder values.');
  console.warn('📝 Please create a .env.local file with your Supabase credentials.');
  console.warn('📚 See README.md or .env.local for instructions.');
  
  // Create client with placeholder values (will fail on actual DB calls, but won't crash the app)
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

