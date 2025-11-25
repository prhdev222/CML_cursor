'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isPatientLoggedIn } from '@/lib/patient-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  User, 
  Calendar, 
  Activity, 
  Pill, 
  AlertTriangle, 
  TrendingDown,
  Building2,
  FileText,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface Patient {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis_date: string;
  hospital?: { name: string };
  current_tki?: string;
  phase: string;
  next_appointment_date?: string;
  next_appointment_notes?: string;
  next_rq_pcr_date_range_start?: string;
  next_rq_pcr_date_range_end?: string;
}

interface TestResult {
  id: string;
  test_date: string;
  bcr_abl_is: number;
  status: string;
}

interface TKIInfo {
  name: string;
  sideEffects: string[];
  monitoring: string[];
}

const TKI_INFO: Record<string, TKIInfo> = {
  imatinib: {
    name: 'Imatinib (Gleevec)',
    sideEffects: ['คลื่นไส้', 'ปวดกล้ามเนื้อ', 'บวมน้ำ', 'ผื่น'],
    monitoring: ['CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'ตรวจตับ'],
  },
  nilotinib: {
    name: 'Nilotinib (Tasigna)',
    sideEffects: ['QT prolongation', 'ตับอักเสบ', 'ไขมันในเลือดสูง', 'ผื่น'],
    monitoring: ['ECG ก่อนเริ่มยา', 'CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'ตรวจตับและไขมัน'],
  },
  dasatinib: {
    name: 'Dasatinib (Sprycel)',
    sideEffects: ['น้ำในเยื่อหุ้มปอด', 'เลือดออก', 'ปวดหัว', 'คลื่นไส้'],
    monitoring: ['CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'CXR ถ้ามีอาการหายใจลำบาก'],
  },
  ponatinib: {
    name: 'Ponatinib (Iclusig)',
    sideEffects: ['ลิ่มเลือดอุดตัน', 'ความดันโลหิตสูง', 'ตับอักเสบ', 'ตับอ่อนอักเสบ'],
    monitoring: ['CBC ทุก 15 วัน', 'RQ-PCR ทุก 3 เดือน', 'ตรวจความดันโลหิต', 'ตรวจหัวใจ'],
  },
};

// Warning and failure thresholds (BCR-ABL1 IS %)
const WARNING_THRESHOLD = 0.1; // MMR threshold
const FAILURE_THRESHOLD = 1.0; // CCyR threshold

export default function PatientPortalPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;
  const t = useTranslations();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (patientId) {
      // Check authentication
      if (!isPatientLoggedIn(patientId)) {
        // Check if patient has password set
        checkPatientPassword();
        return;
      }
      setCheckingAuth(false);
      fetchPatientData();
    }
  }, [patientId, router]);

  const checkPatientPassword = async () => {
    try {
      const { data, error } = await (supabase
        .from('patients') as any)
        .select('password_hash')
        .eq('patient_id', patientId)
        .single();

      if (error || !data) {
        setError('ไม่พบข้อมูลผู้ป่วย');
        setCheckingAuth(false);
        setLoading(false);
        return;
      }

      if (data.password_hash) {
        // Has password, redirect to login
        router.push(`/patient/${patientId}/login`);
      } else {
        // No password, redirect to set password
        router.push(`/patient/${patientId}/set-password`);
      }
    } catch (err) {
      console.error('Error checking password:', err);
      setError('เกิดข้อผิดพลาด');
      setCheckingAuth(false);
      setLoading(false);
    }
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch patient with hospital info
      const { data: patientData, error: patientError } = await (supabase
        .from('patients') as any)
        .select(`
          *,
          hospitals:hospital_id (
            id,
            name
          )
        `)
        .eq('patient_id', patientId)
        .single();

      if (patientError) {
        console.error('Patient fetch error:', patientError);
        setError(`ไม่พบข้อมูลผู้ป่วย: ${patientError.message}`);
        setLoading(false);
        return;
      }

      if (!patientData) {
        setError('ไม่พบข้อมูลผู้ป่วย');
        setLoading(false);
        return;
      }

      // Transform hospital data
      const transformedPatient = {
        ...patientData,
        hospital: patientData.hospitals ? { name: patientData.hospitals.name } : null,
      };
      
      setPatient(transformedPatient);

      // Fetch test results
      const { data: testData, error: testError } = await (supabase
        .from('test_results') as any)
        .select('*')
        .eq('patient_id', patientId)
        .eq('test_type', 'RQ-PCR')
        .order('test_date', { ascending: true });

      if (testError) {
        console.error('Test results fetch error:', testError);
        // Don't throw, just log - test results are optional
      }
      
      setTestResults(testData || []);
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getNextTestDate = () => {
    if (testResults.length === 0) return null;
    const lastTest = testResults[testResults.length - 1];
    if (!lastTest.test_date) return null;
    
    const lastDate = new Date(lastTest.test_date);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 3); // Next test in 3 months
    return nextDate;
  };

  const getPhaseLabel = (phase: string) => {
    const phases: Record<string, string> = {
      chronic: 'ระยะเรื้อรัง',
      accelerated: 'ระยะเร่ง',
      blast: 'ระยะวิกฤติ',
    };
    return phases[phase] || phase;
  };

  const chartData = testResults.map((result) => ({
    date: new Date(result.test_date).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
    value: result.bcr_abl_is,
    status: result.status,
  }));

  const currentTKI = patient?.current_tki || '';
  const tkiInfo = currentTKI ? TKI_INFO[currentTKI] : null;

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบข้อมูล</h2>
            <p className="text-gray-600">{error || 'ไม่พบข้อมูลผู้ป่วย'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextTestDate = getNextTestDate();
  const latestTest = testResults[testResults.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6 pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ข้อมูลผู้ป่วย
          </h1>
          <p className="text-gray-600">รหัสผู้ป่วย: {patient.patient_id}</p>
          <div className="mt-4">
            <Link
              href={`/patient/${patientId}/education`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <BookOpen className="w-5 h-5" />
              เนื้อหาให้ความรู้
            </Link>
          </div>
        </motion.div>

        {/* Patient Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                ข้อมูลส่วนตัว
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ชื่อ</p>
                  <p className="text-lg font-semibold">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">อายุ</p>
                  <p className="text-lg font-semibold">{patient.age} ปี</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">เพศ</p>
                  <p className="text-lg font-semibold">{patient.gender === 'male' ? 'ชาย' : 'หญิง'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">โรงพยาบาล</p>
                  <p className="text-lg font-semibold">{patient.hospital?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">วันที่วินิจฉัย</p>
                  <p className="text-lg font-semibold">
                    {new Date(patient.diagnosis_date).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ระยะโรค</p>
                  <p className="text-lg font-semibold">{getPhaseLabel(patient.phase)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Current Medication */}
        {tkiInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  ยาที่ใช้อยู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{tkiInfo.name}</h3>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">ผลข้างเคียงที่ต้องเฝ้าระวัง:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {tkiInfo.sideEffects.map((effect, idx) => (
                        <li key={idx}>{effect}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">การติดตามผล:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {tkiInfo.monitoring.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Test Results Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                ค่า RQ-PCR for BCR-ABL1
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestTest ? (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">ค่าล่าสุด</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {latestTest.bcr_abl_is?.toFixed(4) || 'N/A'}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        วันที่: {new Date(latestTest.test_date).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    
                    {testResults.length > 0 ? (
                      <>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis 
                                type="number" 
                                domain={[0, 'auto']}
                                label={{ value: 'BCR-ABL1 IS (%)', angle: -90, position: 'insideLeft' }}
                              />
                              <Tooltip />
                              <Legend />
                              <ReferenceLine 
                                y={WARNING_THRESHOLD} 
                                stroke="orange" 
                                strokeDasharray="5 5"
                                label={{ value: 'MMR (0.1%)', position: 'right' }}
                              />
                              <ReferenceLine 
                                y={FAILURE_THRESHOLD} 
                                stroke="red" 
                                strokeDasharray="5 5"
                                label={{ value: 'CCyR (1.0%)', position: 'right' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={{ r: 6 }}
                                name="BCR-ABL1 IS (%)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-yellow-900 mb-1">คำอธิบายกราฟ</h4>
                              <ul className="text-sm text-yellow-800 space-y-1">
                                <li>• <strong>เส้นสีส้ม:</strong> ค่า MMR (0.1%) - ค่านี้ควรระวัง หากเกินอาจต้องพิจารณาเปลี่ยนยา</li>
                                <li>• <strong>เส้นสีแดง:</strong> ค่า CCyR (1.0%) - หากเกินค่านี้จำเป็นต้องเปลี่ยนยา</li>
                                <li>• <strong>เส้นสีน้ำเงิน:</strong> ค่าจริงที่วัดได้</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">ยังไม่มีข้อมูลการตรวจ RQ-PCR</p>
                        <p className="text-sm text-gray-500 mt-2">กรุณาตรวจสอบกับแพทย์เพื่อเพิ่มข้อมูลการตรวจ</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">ยังไม่มีข้อมูลการตรวจ RQ-PCR</p>
                    <p className="text-sm text-gray-500 mt-2">กรุณาตรวจสอบกับแพทย์เพื่อเพิ่มข้อมูลการตรวจ</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Appointment & RQ-PCR Schedule */}
        {(patient.next_appointment_date || patient.next_rq_pcr_date_range_start || nextTestDate) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  การนัดหมายและการวางแผน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Next Appointment */}
                  {patient.next_appointment_date && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-1">วันนัดครั้งต่อไป</p>
                          <p className="text-2xl font-bold text-blue-700 mb-3">
                            {new Date(patient.next_appointment_date).toLocaleDateString('th-TH', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </p>
                          {patient.next_appointment_notes && (
                            <div className="bg-white/80 p-3 rounded-lg mt-3">
                              <p className="text-sm font-semibold text-gray-900 mb-2">📋 หมายเหตุจากแพทย์:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.next_appointment_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RQ-PCR Date Range */}
                  {patient.next_rq_pcr_date_range_start && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
                      <div className="flex items-start gap-3">
                        <Activity className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-1">ช่วงเวลาที่ควรเจาะ RQ-PCR for BCR-ABL</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <p className="text-lg font-bold text-green-700">
                              {new Date(patient.next_rq_pcr_date_range_start).toLocaleDateString('th-TH', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            {patient.next_rq_pcr_date_range_end && (
                              <>
                                <span className="text-gray-500">ถึง</span>
                                <p className="text-lg font-bold text-green-700">
                                  {new Date(patient.next_rq_pcr_date_range_end).toLocaleDateString('th-TH', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            💡 กรุณาเจาะเลือดในช่วงเวลานี้เพื่อติดตามผลการรักษา
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback: Auto-calculated next test date */}
                  {!patient.next_rq_pcr_date_range_start && nextTestDate && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">การเจาะเลือดครั้งต่อไป (ประมาณการ)</p>
                      <p className="text-xl font-bold text-blue-600">
                        {nextTestDate.toLocaleDateString('th-TH', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        * วันที่นี้เป็นการประมาณการจากผลการตรวจครั้งล่าสุด กรุณาตรวจสอบกับแพทย์
                      </p>
                    </div>
                  )}

                  {/* Self-care Instructions */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      การปฏิบัติตัว
                    </h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                      <li>รับประทานยาตามแพทย์สั่งอย่างสม่ำเสมอและตรงเวลา</li>
                      <li>มาตรวจตามนัดทุกครั้ง</li>
                      <li>สังเกตอาการผิดปกติและแจ้งแพทย์ทันที</li>
                      <li>หลีกเลี่ยงการรับประทานอาหารเสริมหรือยาสมุนไพรโดยไม่ปรึกษาแพทย์</li>
                      <li>พักผ่อนให้เพียงพอและออกกำลังกายตามความเหมาะสม</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

