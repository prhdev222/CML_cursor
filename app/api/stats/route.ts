import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      patientsCount,
      hospitalsCount,
      guidelinesCount,
      appointmentsCount,
      testsCount,
      alertsCount,
    ] = await Promise.all([
      supabaseAdmin
        .from('patients')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('hospitals')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('guidelines')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .not('next_appointment_date', 'is', null)
        .gte('next_appointment_date', today.toISOString().split('T')[0])
        .lte('next_appointment_date', nextWeek.toISOString().split('T')[0]),
      supabaseAdmin
        .from('test_results')
        .select('id', { count: 'exact', head: true })
        .gte('test_date', thirtyDaysAgo.toISOString().split('T')[0]),
      supabaseAdmin
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('resolved', false),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        patients: patientsCount.count || 0,
        hospitals: hospitalsCount.count || 0,
        guidelines: guidelinesCount.count || 0,
        upcomingAppointments: appointmentsCount.count || 0,
        recentTests: testsCount.count || 0,
        alerts: alertsCount.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

