'use client';

import { useState, useEffect } from 'react';
import DoctorLayout from '@/components/doctor/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, TestTube, Pill, Calendar, Clock, User, X } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface Patient {
  patient_id: string;
  name: string;
  diagnosis_date: string;
}

export default function DoctorAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [patients, setPatients] = useState<Map<string, Patient>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'mutation' | 'tki'>('unresolved');

  useEffect(() => {
    fetchPatients();
    fetchAlerts();
  }, [filter]);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients', { cache: 'no-store' });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch patients');
      }

      const patientsMap = new Map<string, Patient>();
      (json.data || []).forEach((p: any) => {
        patientsMap.set(p.patient_id, {
          patient_id: p.patient_id,
          name: p.name,
          diagnosis_date: p.diagnosis_date,
        });
      });

      setPatients(patientsMap);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filter === 'unresolved' || filter === 'mutation' || filter === 'tki') {
        params.set('resolved', 'false');
      }

      const res = await fetch(`/api/alerts${params.toString() ? `?${params.toString()}` : ''}`, {
        cache: 'no-store',
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch alerts');
      }

      // Add patient names
      const alertsWithNames = (json.data || []).map((alert: any) => ({
        ...alert,
        patient_name: patients.get(alert.patient_id)?.name || 'Unknown',
      }));

      setAlerts(alertsWithNames);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed to resolve alert');
      }
      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขแจ้งเตือน');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-900',
          icon: 'text-red-600',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-500',
          text: 'text-yellow-900',
          icon: 'text-yellow-600',
        };
      case 'low':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-900',
          icon: 'text-blue-600',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-500',
          text: 'text-gray-900',
          icon: 'text-gray-600',
        };
    }
  };

  const getAlertIcon = (alertType: string) => {
    if (alertType === 'mutation_test_needed') {
      return <TestTube className="w-5 h-5" />;
    }
    if (alertType === 'tki_switch_recommended') {
      return <Pill className="w-5 h-5" />;
    }
    return <AlertTriangle className="w-5 h-5" />;
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !alert.resolved;
    if (filter === 'mutation') return alert.alert_type === 'mutation_test_needed' && !alert.resolved;
    if (filter === 'tki') return alert.alert_type === 'tki_switch_recommended' && !alert.resolved;
    return true;
  });

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">การแจ้งเตือน</h1>
            <p className="text-gray-600 mt-2">ดูและจัดการการแจ้งเตือนสำหรับผู้ป่วย</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'unresolved' ? 'primary' : 'outline'}
                onClick={() => setFilter('unresolved')}
                className="text-sm"
              >
                ยังไม่แก้ไข
              </Button>
              <Button
                variant={filter === 'mutation' ? 'primary' : 'outline'}
                onClick={() => setFilter('mutation')}
                className="text-sm"
              >
                ควรตรวจ Mutation
              </Button>
              <Button
                variant={filter === 'tki' ? 'primary' : 'outline'}
                onClick={() => setFilter('tki')}
                className="text-sm"
              >
                ควรเปลี่ยนยา TKI
              </Button>
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                onClick={() => setFilter('all')}
                className="text-sm"
              >
                ทั้งหมด
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบการแจ้งเตือน</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const colors = getSeverityColor(alert.severity);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={`${colors.bg} ${colors.border} border-2`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={colors.icon}>
                              {getAlertIcon(alert.alert_type)}
                            </div>
                            <h3 className="font-semibold text-lg">{alert.patient_name}</h3>
                            {alert.resolved && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                แก้ไขแล้ว
                              </span>
                            )}
                          </div>
                          <p className={`${colors.text} mb-3`}>{alert.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(alert.created_at).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(alert.created_at).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button
                            onClick={() => handleResolve(alert.id)}
                            className="ml-4 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            แก้ไขแล้ว
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}

