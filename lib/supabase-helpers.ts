/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') {
    // Server-side check
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    return !(
      !url || 
      !key || 
      url === 'your_supabase_url_here' ||
      key === 'your_supabase_anon_key_here' ||
      url.includes('placeholder')
    );
  } else {
    // Client-side check - use public env vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    return !(
      !url || 
      !key || 
      url === 'your_supabase_url_here' ||
      key === 'your_supabase_anon_key_here' ||
      url.includes('placeholder')
    );
  }
}

/**
 * Check if error is a Supabase configuration error
 */
export function isSupabaseConfigError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = String(error?.message || '').toLowerCase();
  const errorCode = String(error?.code || '').toLowerCase();
  const errorDetails = String(error?.details || '').toLowerCase();
  
  // Check for placeholder/configuration errors
  if (errorMessage.includes('placeholder') || 
      errorDetails.includes('placeholder')) {
    return true;
  }
  
  // Check for network/connection errors
  if (errorMessage.includes('failed to fetch') ||
      errorMessage.includes('networkerror') ||
      errorMessage.includes('network request failed') ||
      errorCode === 'pgrst301' || // PostgREST connection error
      errorCode === 'econnrefused' ||
      errorMessage.includes('cors') ||
      errorMessage.includes('refused to connect')) {
    return true;
  }
  
  // Check if Supabase URL is placeholder
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (supabaseUrl.includes('placeholder') || 
      supabaseUrl === 'your_supabase_url_here' ||
      !supabaseUrl) {
    return true;
  }
  
  return false;
}

