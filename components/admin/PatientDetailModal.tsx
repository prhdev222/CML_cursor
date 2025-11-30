'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { X, Activity, User, Calendar, Pill, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getTKIMedication } from '@/lib/tki-medications';

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

interface PatientDetailModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientDetailModal({ patient, isOpen, onClose }: PatientDetailModalProps) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [tkiInfo, setTkiInfo] = useState<TKIInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && patient) {
      fetchPatientDetails();
    }
  }, [isOpen, patient]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);

      // Fetch test results
      const response = await fetch(
        `/api/test-results?patient_id=${patient.patient_id}&test_type=RQ-PCR,RQ-PCR for BCR-ABL`
      );
      const result = await response.json();
      
      if (!result.success) {
        console.error('Test results fetch error:', result.error);
        setTestResults([]);
      } else {
        // Filter out results without bcr_abl_is value and sort by date (ascending - old to new)
        const filteredTestData = (result.data || [])
          .filter((result: any) => result.bcr_abl_is != null)
          .sort((a: any, b: any) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
        setTestResults(filteredTestData);
      }

      // Load TKI medication info
      if (patient.current_tki) {
        try {
          const medication = await getTKIMedication(patient.current_tki);
          if (medication) {
            setTkiInfo({
              name: medication.name_th || medication.name_en || patient.current_tki,
              sideEffects: medication.side_effects || [],
              monitoring: medication.monitoring || [],
            });
          }
        } catch (medError) {
          console.error('Error loading medication:', medError);
        }
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthsSinceDiagnosis = (testDate: string, diagnosisDate: string) => {
    const test = new Date(testDate);
    const diagnosis = new Date(diagnosisDate);
    const diffTime = test.getTime() - diagnosis.getTime();
    const diffMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  };

  const getCMLColor = (value: number, months: number): string => {
    if (value > 10) {
      if (months <= 3) return '#fbbf24'; // YELLOW
      return '#ef4444'; // RED
    } else if (value > 1 && value <= 10) {
      if (months >= 12) return '#ef4444'; // RED
      return '#10b981'; // GREEN
    } else if (value > 0.1 && value <= 1) {
      if (months >= 12) return '#f97316'; // ORANGE
      return '#86efac'; // LIGHT GREEN
    } else {
      return '#10b981'; // GREEN
    }
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

  const getPhaseLabel = (phase: string) => {
    const phases: Record<string, string> = {
      chronic: 'ระยะเรื้อรัง',
      accelerated: 'ระยะเร่ง',
      blast: 'ระยะวิกฤติ',
    };
    return phases[phase] || phase;
  };

  const chartData = testResults.map((result) => {
    const months = getMonthsSinceDiagnosis(result.test_date, patient.diagnosis_date);
    const color = getCMLColor(result.bcr_abl_is || 0, months);
    const elnStatus = getELNResponseStatus(result.bcr_abl_is || 0, months);
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

  const latestTest = testResults[testResults.length - 1];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900">รายละเอียดผู้ป่วย: {patient.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              {/* Patient Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    ข้อมูลส่วนตัว
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="break-words">
                      <p className="text-sm text-gray-600 mb-1">รหัสผู้ป่วย</p>
                      <p className="text-lg font-semibold">{patient.patient_id}</p>
                    </div>
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
                    <div className="break-words">
                      <p className="text-sm text-gray-600 mb-1">TKI ปัจจุบัน</p>
                      <p className="text-lg font-semibold">{patient.current_tki || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Medication */}
              {tkiInfo && (
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
              )}

              {/* Test Results Chart */}
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
                          const latestMonths = getMonthsSinceDiagnosis(latestTest.test_date, patient.diagnosis_date);
                          const latestColor = getCMLColor(latestTest.bcr_abl_is || 0, latestMonths);
                          const colorName = getCMLColorName(latestTest.bcr_abl_is || 0, latestMonths);
                          const elnStatus = getELNResponseStatus(latestTest.bcr_abl_is || 0, latestMonths);
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
                                <div className="w-full">
                                  <h4 className="font-semibold text-blue-900 mb-3">คำอธิบายสีตามเกณฑ์ CML และคำแนะนำการรักษา</h4>
                                  
                                  {/* Color Legend */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 mb-4">
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

                                  {/* Treatment Recommendations */}
                                  <div className="mt-4 pt-4 border-t border-blue-200">
                                    <h5 className="font-semibold text-blue-900 mb-3">คำแนะนำการรักษาตามสี (NCCN Guidelines)</h5>
                                    <div className="space-y-3 text-sm">
                                      <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <div className="flex items-start gap-2 mb-2">
                                          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white mt-0.5"></div>
                                          <div>
                                            <p className="font-semibold text-red-900">RED - TKI-resistant disease</p>
                                            <p className="text-red-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                                            <ul className="list-disc list-inside text-red-700 mt-1 space-y-1">
                                              <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                                              <li>พิจารณาการตรวจ BCR::ABL1 kinase domain mutation</li>
                                              <li>พิจารณาการตรวจ cytogenetic ของไขกระดูกเพื่อประเมิน chromosomal abnormalities เพิ่มเติม</li>
                                            </ul>
                                            <p className="text-red-800 mt-2"><strong>คำแนะนำ:</strong> เปลี่ยนไปใช้ TKI ตัวอื่น (ไม่ใช่ imatinib) และประเมินความเหมาะสมสำหรับ allogeneic HCT</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                                        <div className="flex items-start gap-2 mb-2">
                                          <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white mt-0.5"></div>
                                          <div>
                                            <p className="font-semibold text-yellow-900">YELLOW - Possible TKI resistance</p>
                                            <p className="text-yellow-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                                            <ul className="list-disc list-inside text-yellow-700 mt-1 space-y-1">
                                              <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                                              <li>พิจารณาการตรวจ BCR::ABL1 kinase domain mutation</li>
                                            </ul>
                                            <p className="text-yellow-800 mt-2"><strong>คำแนะนำ:</strong> เปลี่ยนไปใช้ TKI ตัวอื่น หรือ ใช้ TKI เดิมต่อ</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                                        <div className="flex items-start gap-2 mb-2">
                                          <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white mt-0.5"></div>
                                          <div>
                                            <p className="font-semibold text-orange-900">ORANGE - Possible TKI resistance (NEW)</p>
                                            <p className="text-orange-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                                            <ul className="list-disc list-inside text-orange-700 mt-1 space-y-1">
                                              <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                                              <li>พิจารณาการตรวจ BCR::ABL1 kinase domain mutation</li>
                                              <li>พิจารณาการตรวจ cytogenetic ของไขกระดูกเพื่อประเมิน CCyR ที่ 12 เดือน</li>
                                            </ul>
                                            <p className="text-orange-800 mt-2"><strong>คำแนะนำ:</strong> พิจารณาเปลี่ยนไปใช้ TKI ตัวอื่น หรือ ใช้ TKI เดิมต่อหากได้ CCyR แล้ว</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-lime-50 border-l-4 border-lime-400 p-3 rounded">
                                        <div className="flex items-start gap-2 mb-2">
                                          <div className="w-4 h-4 rounded-full bg-lime-300 border-2 border-white mt-0.5"></div>
                                          <div>
                                            <p className="font-semibold text-lime-900">LIGHT GREEN - TKI-sensitive disease</p>
                                            <p className="text-lime-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                                            <ul className="list-disc list-inside text-lime-700 mt-1 space-y-1">
                                              <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                                              <li>หากเป้าหมายการรักษาคือการอยู่รอดระยะยาว: ≤1% เป็นเป้าหมายที่เหมาะสม</li>
                                              <li>หากเป้าหมายการรักษาคือ treatment-free remission: ≤0.1% เป็นเป้าหมายที่เหมาะสม</li>
                                            </ul>
                                            <p className="text-lime-800 mt-2"><strong>คำแนะนำ:</strong> หากเหมาะสม: ใช้ TKI เดิมต่อ | หากไม่เหมาะสม: ตัดสินใจร่วมกับผู้ป่วย</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                        <div className="flex items-start gap-2 mb-2">
                                          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white mt-0.5"></div>
                                          <div>
                                            <p className="font-semibold text-green-900">GREEN - TKI-sensitive disease</p>
                                            <p className="text-green-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                                            <ul className="list-disc list-inside text-green-700 mt-1 space-y-1">
                                              <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                                              <li>ติดตามการตอบสนอง (CML-G)</li>
                                            </ul>
                                            <p className="text-green-800 mt-2"><strong>คำแนะนำ:</strong> ใช้ TKI เดิมต่อ</p>
                                          </div>
                                        </div>
                                      </div>
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
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">ยังไม่มีข้อมูลการตรวจ RQ-PCR</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Appointment Info */}
              {(patient.next_appointment_date || patient.next_rq_pcr_date_range_start) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      การนัดหมายและการวางแผน
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patient.next_appointment_date && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">วันนัดครั้งต่อไป</p>
                          <p className="text-lg font-semibold">
                            {new Date(patient.next_appointment_date).toLocaleDateString('th-TH', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </p>
                          {patient.next_appointment_notes && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm font-semibold text-gray-900 mb-1">📋 หมายเหตุจากแพทย์:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.next_appointment_notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {patient.next_rq_pcr_date_range_start && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">ช่วงเวลาที่ควรเจาะ RQ-PCR for BCR-ABL</p>
                          <p className="text-lg font-semibold">
                            {new Date(patient.next_rq_pcr_date_range_start).toLocaleDateString('th-TH')}
                            {patient.next_rq_pcr_date_range_end && (
                              <> - {new Date(patient.next_rq_pcr_date_range_end).toLocaleDateString('th-TH')}</>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

