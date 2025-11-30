import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch TKI medications
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('tki_medications')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching TKI medications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch TKI medications' },
      { status: 500 }
    );
  }
}

// POST - Create new TKI medication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('tki_medications')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating TKI medication:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create TKI medication' },
      { status: 500 }
    );
  }
}

