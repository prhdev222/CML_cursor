import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

/**
 * Initialize default admin user
 * Run this once: GET /api/admin/init
 */
export async function GET() {
  try {
    // Check if admin exists
    const { data } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (data) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
      });
    }

    // Create default admin with password: admin123
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const { error } = await (supabase.from('admins') as any).insert([
      {
        username: 'admin',
        password_hash: passwordHash,
      },
    ]);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Default admin user created successfully',
      username: 'admin',
      password: 'admin123',
    });
  } catch (error: any) {
    console.error('Init admin error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize admin' },
      { status: 500 }
    );
  }
}

