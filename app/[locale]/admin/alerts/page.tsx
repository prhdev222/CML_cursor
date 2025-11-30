'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AlertTriangle, CheckCircle, XCircle, Eye, Calendar, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Alert {
  id: string;
  patient_id: string;
  alert_type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  resolved: boolean;
  created_at: string;
  test_date?: string;
  bcr_abl_is?: number;
  months_since_test?: number;
  color_name?: string;
  needs_mutation?: boolean;
  patient_name?: string;
}

interface Patient {
  patient_id: string;
  name: string;
  diagnosis_date: string;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [patients, setPatients] = useState<Map<string, Patient>>(new Map());
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await fetchPatients();
      await fetchAlerts();
    };
    loadData();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await (supabase
        .from('patients') as any)
        .select('patient_id, name, diagnosis_date');

      if (error) throw error;

      const patientsMap = new Map<string, Patient>();
      if (data) {
        data.forEach((p: Patient) => {
          patientsMap.set(p.patient_id, p);
        });
      }
      setPatients(patientsMap);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

      // Fetch patients if not already loaded
      let currentPatientsMap = patients;
      if (currentPatientsMap.size === 0) {
        const { data: patientsData } = await (supabase
          .from('patients') as any)
          .select('patient_id, name, diagnosis_date');
        
        if (patientsData) {
          currentPatientsMap = new Map<string, Patient>();
          patientsData.forEach((p: Patient) => {
            currentPatientsMap.set(p.patient_id, p);
          });
          setPatients(currentPatientsMap);
        }
      }

      // Fetch unresolved alerts
      const { data: alertsData, error } = await (supabase
        .from('alerts') as any)
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch latest test results for each patient to get test_date and bcr_abl_is
      const patientIds = [...new Set((alertsData || []).map((a: any) => a.patient_id))];
      
      const testResultsMap = new Map<string, any>();
      if (patientIds.length > 0) {
        const { data: testResults } = await (supabase
          .from('test_results') as any)
          .select('patient_id, test_date, bcr_abl_is, test_type')
          .in('patient_id', patientIds)
          .in('test_type', ['RQ-PCR', 'RQ-PCR for BCR-ABL'])
          .order('test_date', { ascending: false });

        if (testResults) {
          // Get latest test result for each patient that has bcr_abl_is
          testResults.forEach((result: any) => {
            if (result.bcr_abl_is != null && !testResultsMap.has(result.patient_id)) {
              testResultsMap.set(result.patient_id, result);
            }
          });
        }
      }

      // Filter alerts from last 4 months and add patient info
      const filteredAlerts = (alertsData || []).map((alert: any) => {
        const testResult = testResultsMap.get(alert.patient_id);
        const patient = currentPatientsMap.get(alert.patient_id);
        const alertDate = new Date(alert.created_at);
        const monthsSinceTest = Math.floor((Date.now() - alertDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        const isOverdue = monthsSinceTest > 4;

        // Calculate color_name and needs_mutation from test result
        let colorName = alert.color_name;
        let needsMutation = alert.needs_mutation;

        if (testResult && testResult.bcr_abl_is && patient) {
          const testDate = testResult.test_date || alert.created_at.split('T')[0];
          const months = getMonthsSinceDiagnosis(testDate, patient.diagnosis_date);
          colorName = getCMLColorName(testResult.bcr_abl_is, months);
          needsMutation = shouldCheckMutation(testResult.bcr_abl_is, months);
        }

        return {
          ...alert,
          test_date: testResult?.test_date || alert.test_date,
          bcr_abl_is: testResult?.bcr_abl_is || alert.bcr_abl_is,
          months_since_test: monthsSinceTest,
          is_overdue: isOverdue,
          color_name: colorName,
          needs_mutation: needsMutation,
        };
      }).filter((alert: any) => {
        const alertDate = new Date(alert.created_at);
        return alertDate >= fourMonthsAgo;
      });

      setAlerts(filteredAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setResolving(alertId);
      const { error } = await (supabase
        .from('alerts') as any)
        .update({ resolved: true })
        .eq('id', alertId);

      if (error) throw error;

      // Remove from list
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Error resolving alert:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดท');
    } finally {
      setResolving(null);
    }
  };

  const getSeverityColor = (severity: string, isOverdue: boolean) => {
    if (isOverdue) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-500',
        text: 'text-red-900',
        icon: 'text-red-600',
      };
    }
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

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getMonthsSinceDiagnosis = (testDate: string, diagnosisDate: string): number => {
    const test = new Date(testDate);
    const diagnosis = new Date(diagnosisDate);
    const diffTime = test.getTime() - diagnosis.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
  };

  const getCMLColorName = (value: number, months: number): string => {
    if (value > 10) {
      if (months <= 3) return 'YELLOW';
      return 'RED';
    } else if (value > 1 && value <= 10) {
      if (months >= 12) return 'RED';
      return 'GREEN';
    } else if (value > 0.1 && value <= 1) {
      if (months >= 12) return 'ORANGE';
      return 'LIGHT GREEN';
    } else {
      return 'GREEN';
    }
  };

  const shouldCheckMutation = (value: number, months: number): boolean => {
    if (months >= 3 && months < 6) {
      return value > 10;
    }
    if (months >= 6 && months < 12) {
      return value > 1;
    }
    if (months >= 12) {
      return value > 0.1;
    }
    return false;
  };

  const getTreatmentPlan = (alert: Alert) => {
    const patient = patients.get(alert.patient_id);
    if (!patient) return null;

    const plans: string[] = [];

    if (alert.needs_mutation) {
      plans.push('แนะนำให้ตรวจ BCR::ABL1 TKD Mutation');
    }

    if (alert.color_name === 'RED') {
      plans.push('พิจารณาเปลี่ยนไปใช้ TKI ตัวอื่น (ไม่ใช่ imatinib)');
      plans.push('ประเมินความเหมาะสมสำหรับ allogeneic HCT');
    } else if (alert.color_name === 'YELLOW') {
      plans.push('พิจารณาเปลี่ยนไปใช้ TKI ตัวอื่น หรือ ใช้ TKI เดิมต่อ');
    } else if (alert.color_name === 'ORANGE') {
      plans.push('พิจารณาเปลี่ยนไปใช้ TKI ตัวอื่น หรือ ใช้ TKI เดิมต่อหากได้ CCyR แล้ว');
    } else if (alert.color_name === 'LIGHT GREEN') {
      plans.push('หากเหมาะสม: ใช้ TKI เดิมต่อ | หากไม่เหมาะสม: ตัดสินใจร่วมกับผู้ป่วย');
    }

    if (alert.alert_type === 'non_optimal_result') {
      plans.push('ติดตามผลการตรวจอย่างใกล้ชิด');
      plans.push('ประเมินการรับประทานยาของผู้ป่วย');
    }

    return plans;
  };

  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateAlertsFromExistingTests = async () => {
    try {
      setGenerating(true);
      const fourMonthsAgo = new Date();
      fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

      // Fetch all patients first
      const { data: patientsData } = await (supabase
        .from('patients') as any)
        .select('patient_id, diagnosis_date');

      if (!patientsData) {
        alert('ไม่พบข้อมูลผู้ป่วย');
        return;
      }

      const patientsMap = new Map<string, Patient>();
      patientsData.forEach((p: any) => {
        patientsMap.set(p.patient_id, {
          patient_id: p.patient_id,
          name: '',
          diagnosis_date: p.diagnosis_date,
        });
      });

      // Fetch all test results from last 4 months
      const { data: testResults, error: testError } = await (supabase
        .from('test_results') as any)
        .select('*')
        .in('test_type', ['RQ-PCR', 'RQ-PCR for BCR-ABL'])
        .not('bcr_abl_is', 'is', null)
        .gte('test_date', fourMonthsAgo.toISOString().split('T')[0])
        .order('test_date', { ascending: false });

      if (testError) throw testError;

      if (!testResults || testResults.length === 0) {
        alert('ไม่พบผลการตรวจในช่วง 4 เดือนล่าสุด');
        return;
      }

      // Import generateAlertsForTestResult
      const { generateAlertsForTestResult } = await import('@/lib/alerts');

      let created = 0;
      for (const testResult of testResults) {
        const patient = patientsMap.get(testResult.patient_id);
        if (patient) {
          try {
            await generateAlertsForTestResult(
              {
                patient_id: testResult.patient_id,
                test_date: testResult.test_date,
                bcr_abl_is: testResult.bcr_abl_is,
                test_type: testResult.test_type,
                status: testResult.status,
              },
              {
                patient_id: testResult.patient_id,
                diagnosis_date: patient.diagnosis_date,
              }
            );
            created++;
          } catch (err) {
            console.error('Error generating alert for test:', err);
          }
        }
      }

      alert(`สร้าง alerts สำเร็จ ${created} รายการ`);
      await fetchAlerts();
    } catch (error) {
      console.error('Error generating alerts:', error);
      alert(`เกิดข้อผิดพลาดในการสร้าง alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">การแจ้งเตือน</h1>
            <p className="text-gray-600 mt-2">แจ้งเตือนผลการตรวจที่ต้องติดตาม (4 เดือนล่าสุด)</p>
          </div>
          <Button
            onClick={generateAlertsFromExistingTests}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {generating ? 'กำลังสร้าง...' : 'สร้าง Alerts จากข้อมูลเก่า'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">ไม่มีข้อความแจ้งเตือน</p>
              <p className="text-gray-500 text-sm mt-2">ผลการตรวจทั้งหมดอยู่ในเกณฑ์ปกติ</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const patient = patients.get(alert.patient_id);
              const colors = getSeverityColor(alert.severity, alert.is_overdue || false);
              const treatmentPlan = getTreatmentPlan(alert);
              const isExpanded = expandedAlert === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`border-l-4 ${colors.border} ${colors.bg}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={colors.icon}>
                              {getAlertIcon(alert.severity)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-semibold text-lg">
                                  {alert.patient_id} - {patient?.name || 'ไม่พบข้อมูล'}
                                </span>
                              </div>
                              {alert.is_overdue && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                                  <Clock className="w-3 h-3" />
                                  ข้อมูลเลย 4 เดือนแล้ว ({alert.months_since_test} เดือน)
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="ml-8 space-y-2">
                            <p className={`font-medium ${colors.text}`}>
                              {alert.message}
                            </p>

                            {alert.test_date && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>วันที่ตรวจ: {new Date(alert.test_date).toLocaleDateString('th-TH')}</span>
                                {alert.months_since_test !== undefined && (
                                  <span className="text-gray-400">• {alert.months_since_test} เดือนที่แล้ว</span>
                                )}
                              </div>
                            )}

                            {alert.bcr_abl_is !== undefined && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">BCR-ABL1 IS: </span>
                                {alert.bcr_abl_is.toFixed(4)}%
                                {alert.color_name && (
                                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                                    alert.color_name === 'RED' ? 'bg-red-100 text-red-800' :
                                    alert.color_name === 'YELLOW' ? 'bg-yellow-100 text-yellow-800' :
                                    alert.color_name === 'ORANGE' ? 'bg-orange-100 text-orange-800' :
                                    alert.color_name === 'LIGHT GREEN' ? 'bg-lime-100 text-lime-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {alert.color_name}
                                  </span>
                                )}
                              </div>
                            )}

                            {treatmentPlan && treatmentPlan.length > 0 && (
                              <div className="mt-4">
                                <button
                                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                  <Eye className="w-4 h-4" />
                                  {isExpanded ? 'ซ่อน' : 'ดู'} แผนการรักษา
                                </button>

                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 p-4 bg-white rounded-lg border border-gray-200"
                                  >
                                    <h4 className="font-semibold text-gray-900 mb-3">แผนการรักษาที่แนะนำ:</h4>
                                    <ul className="space-y-2">
                                      {treatmentPlan.map((plan, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                          <span className="text-blue-600 mt-1">•</span>
                                          <span>{plan}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </motion.div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4">
                          <Button
                            onClick={() => handleResolve(alert.id)}
                            disabled={resolving === alert.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {resolving === alert.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>กำลังดำเนินการ...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                <span>ดำเนินการแล้ว</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

