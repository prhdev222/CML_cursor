/**
 * Enhanced error handling for Supabase connection issues
 */

export interface SupabaseErrorInfo {
  isConfigError: boolean;
  isNetworkError: boolean;
  message: string;
  suggestions: string[];
}

/**
 * Analyze Supabase error and provide helpful suggestions
 */
export function analyzeSupabaseError(error: any): SupabaseErrorInfo {
  const errorMessage = String(error?.message || '').toLowerCase();
  const errorCode = String(error?.code || '');
  
  const info: SupabaseErrorInfo = {
    isConfigError: false,
    isNetworkError: false,
    message: error?.message || 'Unknown error',
    suggestions: [],
  };

  // Check for network/connection errors
  if (
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('networkerror') ||
    errorMessage.includes('network request failed') ||
    errorMessage.includes('fetch failed') ||
    errorCode === 'PGRST301' ||
    errorCode === 'ECONNREFUSED' ||
    errorMessage.includes('cors') ||
    errorMessage.includes('refused to connect')
  ) {
    info.isNetworkError = true;
    info.suggestions = [
      'ตรวจสอบว่าไฟล์ .env.local มีอยู่และมีค่าถูกต้อง',
      'ตรวจสอบ NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
      'ตรวจสอบว่า Supabase project ยัง active อยู่',
      'ลองรีสตาร์ท development server (npm run dev)',
      'ตรวจสอบ console ใน browser สำหรับ error เพิ่มเติม',
    ];
  }

  // Check for configuration errors
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === 'your_supabase_url_here' ||
    supabaseKey === 'your_supabase_anon_key_here' ||
    supabaseUrl.includes('placeholder')
  ) {
    info.isConfigError = true;
    info.suggestions = [
      'สร้างไฟล์ .env.local ใน root directory',
      'เพิ่ม NEXT_PUBLIC_SUPABASE_URL จาก Supabase Dashboard',
      'เพิ่ม NEXT_PUBLIC_SUPABASE_ANON_KEY จาก Supabase Dashboard',
      'รีสตาร์ท development server หลังจากแก้ไข .env.local',
    ];
  }

  return info;
}

/**
 * Display user-friendly error message
 */
export function getErrorMessage(error: any): string {
  const analysis = analyzeSupabaseError(error);
  
  if (analysis.isConfigError) {
    return '⚠️ Supabase ยังไม่ได้ตั้งค่า กรุณาตรวจสอบไฟล์ .env.local';
  }
  
  if (analysis.isNetworkError) {
    return '⚠️ ไม่สามารถเชื่อมต่อกับ Supabase ได้ กรุณาตรวจสอบการตั้งค่าและอินเทอร์เน็ต';
  }
  
  return analysis.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Supabase';
}



