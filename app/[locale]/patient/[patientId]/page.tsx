'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isPatientLoggedIn } from '@/lib/patient-auth';
import { getTKIMedication } from '@/lib/tki-medications';
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
  const [tkiInfo, setTkiInfo] = useState<TKIInfo | null>(null);

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
      const res = await fetch(`/api/patient/check-password?patient_id=${patientId}`, {
        cache: 'no-store',
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'ไม่พบข้อมูลผู้ป่วย');
        setCheckingAuth(false);
        setLoading(false);
        return;
      }

      if (json.hasPassword) {
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
      const patientsResponse = await fetch('/api/patients');
      const patientsResult = await patientsResponse.json();

      if (!patientsResult.success) {
        console.error('Patient fetch error:', patientsResult.error);
        setError(`ไม่พบข้อมูลผู้ป่วย: ${patientsResult.error}`);
        setLoading(false);
        return;
      }

      const patientData = patientsResult.data?.find((p: any) => p.patient_id === patientId);

      if (!patientData) {
        setError('ไม่พบข้อมูลผู้ป่วย');
        setLoading(false);
        return;
      }

      // Transform hospital data
      const transformedPatient = {
        ...patientData,
        hospital: patientData.hospital ? { name: patientData.hospital.name } : null,
      };
      
      setPatient(transformedPatient);

      // Load TKI medication info if patient has current_tki
      if (transformedPatient.current_tki) {
        try {
          const medication = await getTKIMedication(transformedPatient.current_tki);
          if (medication) {
            setTkiInfo({
              name: medication.name_en,
              sideEffects: medication.side_effects,
              monitoring: medication.monitoring,
            });
          } else {
            // Fallback to null if medication not found
            setTkiInfo(null);
          }
        } catch (medError) {
          console.error('Error loading medication:', medError);
          setTkiInfo(null);
        }
      } else {
        setTkiInfo(null);
      }

      // Fetch test results
      const testResponse = await fetch(
        `/api/test-results?patient_id=${patientId}&test_type=RQ-PCR,RQ-PCR for BCR-ABL`
      );
      const testResult = await testResponse.json();
      
      if (!testResult.success) {
        console.error('Test results fetch error:', testResult.error);
        // Don't throw, just log - test results are optional
        setTestResults([]);
      } else {
        // Filter out results without bcr_abl_is value (already sorted by API)
        const filteredTestData = (testResult.data || [])
          .filter((result: any) => result.bcr_abl_is != null);
        setTestResults(filteredTestData);
      }
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

  // ELN 2020 Response Status (Optimal, Warning, Failure)
  // ประเมินตาม milestone ที่ผ่านมาแล้วเท่านั้น
  const getELNResponseStatus = (value: number, months: number): { status: 'optimal' | 'warning' | 'failure' | 'not-assessed', label: string } => {
    // ก่อน 3 เดือน: ยังไม่ประเมิน milestone
    if (months < 3) {
      return { status: 'not-assessed', label: 'Not assessed' };
    }
    
    // ที่ 3 เดือน: ประเมิน milestone 3 เดือน (≤10% optimal, >10% failure)
    if (months >= 3 && months < 6) {
      if (value <= 10) {
        return { status: 'optimal', label: 'Optimal' };
      } else {
        return { status: 'failure', label: 'Failure' };
      }
    }
    
    // ที่ 6 เดือน: ประเมิน milestone 6 เดือน (≤1% optimal, >1% but ≤10% warning, >10% failure)
    if (months >= 6 && months < 12) {
      if (value <= 1) {
        return { status: 'optimal', label: 'Optimal' };
      } else if (value > 1 && value <= 10) {
        return { status: 'warning', label: 'Warning' };
      } else {
        return { status: 'failure', label: 'Failure' };
      }
    }
    
    // ที่ 12 เดือนขึ้นไป: ประเมิน milestone 12 เดือน (≤0.1% optimal, >0.1% but ≤1% warning, >1% failure)
    if (months >= 12) {
      if (value <= 0.1) {
        return { status: 'optimal', label: 'Optimal' };
      } else if (value > 0.1 && value <= 1) {
        return { status: 'warning', label: 'Warning' };
      } else {
        return { status: 'failure', label: 'Failure' };
      }
    }
    
    // Default
    return { status: 'not-assessed', label: 'Not assessed' };
  };

  // Calculate months since diagnosis for each test
  const getMonthsSinceDiagnosis = (testDate: string, diagnosisDate: string) => {
    const test = new Date(testDate);
    const diagnosis = new Date(diagnosisDate);
    const diffTime = test.getTime() - diagnosis.getTime();
    const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  };

  // Get color based on CML guidelines
  const getCMLColor = (value: number, months: number): string => {
    if (value > 10) {
      // >10%
      if (months <= 3) return '#fbbf24'; // YELLOW
      return '#ef4444'; // RED (6 or 12 months)
    } else if (value > 1 && value <= 10) {
      // >1%-10%
      if (months >= 12) return '#ef4444'; // RED at 12 months
      return '#10b981'; // GREEN at 3 or 6 months
    } else if (value > 0.1 && value <= 1) {
      // >0.1%-1%
      if (months >= 12) return '#f97316'; // ORANGE at 12 months
      return '#86efac'; // LIGHT GREEN at 3 or 6 months
    } else {
      // ≤0.1%
      return '#10b981'; // GREEN
    }
  };

  const chartData = testResults.map((result) => {
    const months = patient ? getMonthsSinceDiagnosis(result.test_date, patient.diagnosis_date) : 0;
    const color = getCMLColor(result.bcr_abl_is || 0, months);
    const elnStatus = patient ? getELNResponseStatus(result.bcr_abl_is || 0, months) : { status: 'optimal' as const, label: 'Optimal' };
    return {
      date: new Date(result.test_date).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
      value: result.bcr_abl_is,
      status: result.status,
      color: color,
      months: months,
      elnStatus: elnStatus.status,
      elnLabel: elnStatus.label,
    };
  });

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="break-words">
                  <p className="text-sm text-gray-600 mb-1">ชื่อ</p>
                  <p className="text-lg font-semibold break-words">{patient.name}</p>
                </div>
                <div className="break-words">
                  <p className="text-sm text-gray-600 mb-1">อายุ</p>
                  <p className="text-lg font-semibold">{patient.age} ปี</p>
                </div>
                <div className="break-words">
                  <p className="text-sm text-gray-600 mb-1">เพศ</p>
                  <p className="text-lg font-semibold">{patient.gender === 'male' ? 'ชาย' : 'หญิง'}</p>
                </div>
                <div className="break-words">
                  <p className="text-sm text-gray-600 mb-1">โรงพยาบาล</p>
                  <p className="text-lg font-semibold break-words">{patient.hospital?.name || '-'}</p>
                </div>
                <div className="break-words">
                  <p className="text-sm text-gray-600 mb-1">วันที่วินิจฉัย</p>
                  <p className="text-lg font-semibold">
                    {new Date(patient.diagnosis_date).toLocaleDateString('th-TH')}
                  </p>
                </div>
                <div className="break-words">
                  <p className="text-sm text-gray-600 mb-1">ระยะโรค</p>
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
                    {(() => {
                      const latestMonths = patient ? getMonthsSinceDiagnosis(latestTest.test_date, patient.diagnosis_date) : 0;
                      const latestColor = getCMLColor(latestTest.bcr_abl_is || 0, latestMonths);
                      const colorName = getCMLColorName(latestTest.bcr_abl_is || 0, latestMonths);
                      const elnStatus = patient ? getELNResponseStatus(latestTest.bcr_abl_is || 0, latestMonths) : { status: 'optimal' as const, label: 'Optimal' };
                      return (
                        <div className={`p-4 rounded-lg border-2`} style={{ 
                          backgroundColor: latestColor + '20', 
                          borderColor: latestColor 
                        }}>
                          <p className="text-sm text-gray-600">ค่าล่าสุด ({latestMonths} เดือน)</p>
                          <p className="text-2xl font-bold" style={{ color: latestColor }}>
                            {latestTest.bcr_abl_is?.toFixed(4) || 'N/A'}%
                          </p>
                          <p className="text-xs font-semibold mt-1" style={{ color: latestColor }}>
                            สถานะ: {colorName}{elnStatus.status !== 'not-assessed' ? ` (${elnStatus.label})` : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            วันที่: {new Date(latestTest.test_date).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      );
                    })()}
                    
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
                              <Tooltip 
                                formatter={(value: any, name: string, props: any) => {
                                  const months = props.payload.months;
                                  const colorName = getCMLColorName(props.payload.value, months);
                                  const elnLabel = props.payload.elnLabel || '';
                                  const elnStatus = props.payload.elnStatus || '';
                                  const elnText = elnStatus !== 'not-assessed' ? `, ${elnLabel}` : '';
                                  return [
                                    `${value?.toFixed(4)}% (${months} เดือน, ${colorName}${elnText})`,
                                    'BCR-ABL1 IS (%)'
                                  ];
                                }}
                              />
                              <Legend />
                              <ReferenceLine 
                                y={0.1} 
                                stroke="#86efac" 
                                strokeDasharray="5 5"
                                strokeWidth={1}
                                label={{ value: 'MMR (0.1%)', position: 'right' }}
                              />
                              <ReferenceLine 
                                y={1.0} 
                                stroke="#f97316" 
                                strokeDasharray="5 5"
                                strokeWidth={1}
                                label={{ value: '1%', position: 'right' }}
                              />
                              <ReferenceLine 
                                y={10.0} 
                                stroke="#fbbf24" 
                                strokeDasharray="5 5"
                                strokeWidth={1}
                                label={{ value: '10%', position: 'right' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                dot={(props: any) => {
                                  const { cx, cy, payload } = props;
                                  return (
                                    <circle 
                                      cx={cx} 
                                      cy={cy} 
                                      r={8} 
                                      fill={payload.color} 
                                      stroke="#fff" 
                                      strokeWidth={2}
                                    />
                                  );
                                }}
                                activeDot={{ r: 10 }}
                                name="BCR-ABL1 IS (%)"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-2">คำอธิบายสีตามเกณฑ์ CML</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                                  <span><strong>GREEN:</strong> ≤0.1% หรือ {'>'}0.1%-1% ที่ 3-6 เดือน</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-lime-300 border-2 border-white"></div>
                                  <span><strong>LIGHT GREEN:</strong> {'>'}0.1%-1% ที่ 3-6 เดือน</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white"></div>
                                  <span><strong>YELLOW:</strong> {'>'}10% ที่ 3 เดือน</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                                  <span><strong>ORANGE:</strong> {'>'}0.1%-1% ที่ 12 เดือน</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                                  <span><strong>RED:</strong> {'>'}10% ที่ 6-12 เดือน หรือ {'>'}1%-10% ที่ 12 เดือน</span>
                                </div>
                              </div>
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

