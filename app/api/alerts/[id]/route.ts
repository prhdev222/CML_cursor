import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT - Update alert (e.g., resolve)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('alerts')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update alert' },
      { status: 500 }
    );
  }
}

