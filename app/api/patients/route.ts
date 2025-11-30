import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch all patients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    let query = supabaseAdmin
      .from('patients')
      .select(`
        *,
        hospital:hospitals(*)
      `)
      .order('created_at', { ascending: false });

    // Filter for upcoming appointments (next 7 days)
    if (filter === 'appointments') {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      query = query
        .not('next_appointment_date', 'is', null)
        .gte('next_appointment_date', today.toISOString().split('T')[0])
        .lte('next_appointment_date', nextWeek.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert([body])
      .select(`
        *,
        hospital:hospitals(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create patient' },
      { status: 500 }
    );
  }
}

