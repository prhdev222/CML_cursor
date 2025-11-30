import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Create new TKI record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('tki_records')
      .insert(Array.isArray(body) ? body : [body])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating TKI record:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create TKI record' },
      { status: 500 }
    );
  }
}

// GET - Fetch TKI records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const limit = searchParams.get('limit');

    let query = supabaseAdmin
      .from('tki_records')
      .select('*')
      .order('start_date', { ascending: false });

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching TKI records:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch TKI records' },
      { status: 500 }
    );
  }
}

