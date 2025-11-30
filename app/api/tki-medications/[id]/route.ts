import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// PUT - Update TKI medication
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('tki_medications')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating TKI medication:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update TKI medication' },
      { status: 500 }
    );
  }
}

// DELETE - Delete TKI medication
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('tki_medications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting TKI medication:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete TKI medication' },
      { status: 500 }
    );
  }
}

