import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Update TKI records by filter (for bulk updates)
export async function POST(request: NextRequest) {
  try {
    const { filter, update } = await request.json();
    
    if (!filter || !update) {
      return NextResponse.json(
        { success: false, error: 'Filter and update data are required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from('tki_records').update(update);

    // Apply filters
    if (filter.patient_id) {
      query = query.eq('patient_id', filter.patient_id);
    }
    if (filter.end_date_is_null !== undefined) {
      if (filter.end_date_is_null) {
        query = query.is('end_date', null);
      } else {
        query = query.not('end_date', 'is', null);
      }
    }

    const { data, error } = await query.select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating TKI records:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update TKI records' },
      { status: 500 }
    );
  }
}

