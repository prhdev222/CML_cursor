import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch test results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const patientIds = searchParams.get('patient_ids');
    const testType = searchParams.get('test_type');
    const limit = searchParams.get('limit');

    let query = supabaseAdmin
      .from('test_results')
      .select('*')
      .order('test_date', { ascending: true }); // Sort ascending (old to new) for charts

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (patientIds) {
      const ids = patientIds.split(',');
      query = query.in('patient_id', ids);
    }

    if (testType) {
      query = query.in('test_type', testType.split(','));
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}

// POST - Create new test result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('test_results')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating test result:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create test result' },
      { status: 500 }
    );
  }
}

