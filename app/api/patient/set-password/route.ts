import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
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

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if patient exists (using admin client to bypass RLS)
    const { data: patientData, error: fetchError } = await (supabaseAdmin
      .from('patients') as any)
      .select('password_hash')
      .eq('patient_id', patient_id)
      .single();

    if (fetchError || !patientData) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ป่วย' },
        { status: 404 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update patient password (using admin client to bypass RLS)
    const { error: updateError } = await (supabaseAdmin
      .from('patients') as any)
      .update({ password_hash: passwordHash })
      .eq('patient_id', patient_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    });
  } catch (error: any) {
    console.error('Set password API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set password' },
      { status: 500 }
    );
  }
}
