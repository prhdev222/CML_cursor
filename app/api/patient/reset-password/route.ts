import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { patient_id, new_password } = await request.json();

    if (!patient_id || !new_password) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and new password are required' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Update patient password (using admin client to bypass RLS)
    const { error } = await (supabaseAdmin
      .from('patients') as any)
      .update({ 
        password_hash: passwordHash,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('patient_id', patient_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
