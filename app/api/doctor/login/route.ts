import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { doctor_code, password } = await request.json();

    if (!doctor_code || !password) {
      return NextResponse.json(
        { success: false, error: 'Doctor code and password are required' },
        { status: 400 }
      );
    }

    // Fetch doctor from database
    const { data, error } = await (supabase
      .from('doctors') as any)
      .select('*')
      .eq('doctor_code', doctor_code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor code or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, (data as any).password_hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid doctor code or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      doctor: {
        doctor_code: data.doctor_code,
        name: data.name,
      },
    });
  } catch (error: any) {
    console.error('Doctor login API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}


