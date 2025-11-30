'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Building2, BookOpen, FileText, Activity, Pill, ArrowRight, TrendingUp, Clock, AlertCircle, Calendar, TestTube, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DashboardStats {
  patients: number;
  hospitals: number;
  guidelines: number;
  upcomingAppointments: number;
  recentTests: number;
  alerts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    hospitals: 0,
    guidelines: 0,
    upcomingAppointments: 0,
    recentTests: 0,
    alerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);

      const [patientsRes, hospitalsRes, guidelinesRes, appointmentsRes, testsRes, alertsRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('hospitals').select('id', { count: 'exact', head: true }),
        supabase.from('guidelines').select('id', { count: 'exact', head: true }),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .not('next_appointment_date', 'is', null)
          .gte('next_appointment_date', today.toISOString().split('T')[0])
          .lte('next_appointment_date', nextWeek.toISOString().split('T')[0]),
        supabase
          .from('test_results')
          .select('id', { count: 'exact', head: true })
          .gte('test_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase
          .from('alerts')
          .select('id', { count: 'exact', head: true })
          .eq('resolved', false),
      ]);

      setStats({
        patients: patientsRes.count || 0,
        hospitals: hospitalsRes.count || 0,
        guidelines: guidelinesRes.count || 0,
        upcomingAppointments: appointmentsRes.count || 0,
        recentTests: testsRes.count || 0,
        alerts: alertsRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'ผู้ป่วยทั้งหมด', 
      value: stats.patients, 
      icon: Users, 
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      href: '/admin/patients'
    },
    { 
      label: 'นัดหมายใกล้เคียง', 
      value: stats.upcomingAppointments, 
      icon: Calendar, 
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      href: '/admin/patients?filter=appointments'
    },
    { 
      label: 'ผลตรวจล่าสุด', 
      value: stats.recentTests, 
      icon: TestTube, 
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      href: '/admin/monitoring?filter=recent'
    },
    { 
      label: 'การแจ้งเตือน', 
      value: stats.alerts, 
      icon: AlertTriangle, 
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      href: '/admin/alerts'
    },
    { 
      label: 'โรงพยาบาล', 
      value: stats.hospitals, 
      icon: Building2, 
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      href: '/admin/hospitals'
    },
    { 
      label: 'แนวทางปฏิบัติ', 
      value: stats.guidelines, 
      icon: BookOpen, 
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-700',
      href: '/admin/guidelines'
    },
  ];


  return (
    <AdminLayout>
      <div className="space-y-8 pb-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-blue-100 text-lg">ภาพรวมระบบจัดการ CML</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">
                {new Date().toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            สถิติภาพรวม
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Link href={card.href} className="block h-full">
                  <Card className={`h-full border-2 ${card.borderColor} ${card.bgColor} hover:shadow-lg transition-all duration-300 group`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-600 mb-1">{card.label}</p>
                          {loading ? (
                            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                          ) : (
                            <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                          )}
                        </div>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-md group-hover:shadow-lg transition-shadow`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex items-center text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">
                        <span>ดูรายละเอียด</span>
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

