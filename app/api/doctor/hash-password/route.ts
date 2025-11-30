import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    return NextResponse.json({ hash });
  } catch (error: any) {
    console.error('Hash password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to hash password' },
      { status: 500 }
    );
  }
}


