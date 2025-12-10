import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Fetch patient password_hash (using admin client to bypass RLS)
    const { data, error } = await (supabaseAdmin
      .from('patients') as any)
      .select('password_hash')
      .eq('patient_id', patientId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลผู้ป่วย', hasPassword: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hasPassword: !!data.password_hash,
    });
  } catch (error: any) {
    console.error('Check password API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check password', hasPassword: false },
      { status: 500 }
    );
  }
}

