import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved');

    let query = supabaseAdmin
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

