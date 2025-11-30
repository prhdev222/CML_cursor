import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch single patient by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        hospital:hospitals(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

// PUT - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('patients')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        hospital:hospitals(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update patient' },
      { status: 500 }
    );
  }
}

// DELETE - Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete patient' },
      { status: 500 }
    );
  }
}

