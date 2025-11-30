'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DoctorLayout from '@/components/doctor/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, Users, AlertTriangle, TestTube, Pill, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Alert {
  id: string;
  patient_id: string;
  alert_type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  resolved: boolean;
  created_at: string;
  patient_name?: string;
}

interface DashboardStats {
  totalPatients: number;
  activeAlerts: number;
  mutationTestsNeeded: number;
  tkiSwitchNeeded: number;
}

export default function DoctorDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeAlerts: 0,
    mutationTestsNeeded: 0,
    tkiSwitchNeeded: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch patients count
      const { count: patientsCount } = await (supabase
        .from('patients') as any)
        .select('*', { count: 'exact', head: true });

      // Fetch active alerts
      const { data: alertsData } = await (supabase
        .from('alerts') as any)
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get patient names for alerts
      const patientIds = [...new Set((alertsData || []).map((a: any) => a.patient_id))];
      const { data: patientsData } = await (supabase
        .from('patients') as any)
        .select('patient_id, name')
        .in('patient_id', patientIds);

      const patientsMap = new Map((patientsData || []).map((p: any) => [p.patient_id, p.name]));

      const alertsWithNames = (alertsData || []).map((alert: any) => ({
        ...alert,
        patient_name: patientsMap.get(alert.patient_id) || 'Unknown',
      }));

      // Count mutation tests needed
      const mutationAlerts = alertsWithNames.filter(
        (a: any) => a.alert_type === 'mutation_test_needed'
      );

      // Count TKI switch needed
      const tkiAlerts = alertsWithNames.filter(
        (a: any) => a.alert_type === 'tki_switch_recommended'
      );

      setStats({
        totalPatients: patientsCount || 0,
        activeAlerts: alertsWithNames.length,
        mutationTestsNeeded: mutationAlerts.length,
        tkiSwitchNeeded: tkiAlerts.length,
      });

      setRecentAlerts(alertsWithNames.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (alertType: string) => {
    if (alertType === 'mutation_test_needed') return <TestTube className="w-5 h-5" />;
    if (alertType === 'tki_switch_recommended') return <Pill className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลด...</div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">ภาพรวมระบบจัดการผู้ป่วย CML</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ผู้ป่วยทั้งหมด</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPatients}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">แจ้งเตือนที่ยังไม่แก้ไข</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeAlerts}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ควรตรวจ Mutation</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.mutationTestsNeeded}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TestTube className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ควรเปลี่ยนยา TKI</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.tkiSwitchNeeded}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <Pill className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/doctor/patients">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Search className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ค้นหาผู้ป่วย</h3>
                    <p className="text-sm text-gray-600">ค้นหาและจัดการข้อมูลผู้ป่วย</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/doctor/patients?action=add">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">เพิ่มผู้ป่วยใหม่</h3>
                    <p className="text-sm text-gray-600">ลงทะเบียนผู้ป่วยใหม่</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/doctor/alerts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">ดูแจ้งเตือน</h3>
                    <p className="text-sm text-gray-600">ตรวจสอบการแจ้งเตือนทั้งหมด</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>แจ้งเตือนล่าสุด</CardTitle>
              <Link href="/doctor/alerts">
                <Button variant="outline" className="text-sm">
                  ดูทั้งหมด
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ไม่มีแจ้งเตือน
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getAlertIcon(alert.alert_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{alert.patient_name}</p>
                          <span className="text-xs">
                            {new Date(alert.created_at).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  );
}


