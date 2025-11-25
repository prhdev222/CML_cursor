import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { patient_id, password } = await request.json();

    if (!patient_id || !password) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and password are required' },
        { status: 400 }
      );
    }

    // Fetch patient from database
    const { data, error: fetchError } = await (supabase
      .from('patients') as any)
      .select('*')
      .eq('patient_id', patient_id)
      .single();

    if (fetchError || !data) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ป่วย' },
        { status: 401 }
      );
    }

    // Check if patient has password set
    if (!data.password_hash) {
      return NextResponse.json(
        { success: false, error: 'ยังไม่ได้ตั้งรหัสผ่าน กรุณาตั้งรหัสผ่านก่อน' },
        { status: 400 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, data.password_hash);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
