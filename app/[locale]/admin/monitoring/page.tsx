'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateAlertsForTestResult } from '@/lib/alerts';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Activity, Plus, AlertTriangle, CheckCircle, XCircle, AlertCircle, Search, X, TestTube } from 'lucide-react';
import { motion } from 'framer-motion';

interface Patient {
  id: string;
  patient_id: string;
  name: string;
  diagnosis_date: string;
}

interface TestResult {
  id: string;
  patient_id: string;
  test_date: string;
  bcr_abl_is: number;
  test_type: string;
  status: string;
  patient?: {
    patient_id: string;
    name: string;
  };
}

export default function AdminMonitoringPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    test_date: new Date().toISOString().split('T')[0],
    bcr_abl_is: '',
    test_type: 'RQ-PCR for BCR-ABL',
    hematologic_response: false,
    cbc_abnormal_values: '',
    ph_chromosome_percent: '',
    chromosome_type: 'P210',
    other_chromosome: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [interpretation, setInterpretation] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPatients();
    if (filter === 'recent') {
      fetchRecentTests();
    }
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [filter]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter(
        (p) =>
          p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
      setShowPatientDropdown(true);
    } else {
      setFilteredPatients(patients);
      setShowPatientDropdown(false);
    }
  }, [searchQuery, patients]);

  useEffect(() => {
    if (selectedPatientId) {
      const patient = patients.find(p => p.patient_id === selectedPatientId);
      setSelectedPatient(patient || null);
      calculateInterpretation();
    } else {
      setSelectedPatient(null);
      setInterpretation(null);
    }
  }, [selectedPatientId, formData.bcr_abl_is, formData.test_date, patients]);

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowPatientDropdown(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await (supabase
        .from('patients') as any)
        .select('id, patient_id, name, diagnosis_date')
        .order('patient_id', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
      setFilteredPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchRecentTests = async () => {
    try {
      setLoading(true);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await (supabase
        .from('test_results') as any)
        .select(`
          *,
          patient:patients(patient_id, name)
        `)
        .gte('test_date', thirtyDaysAgo)
        .order('test_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRecentTests(data || []);
    } catch (error) {
      console.error('Error fetching recent tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientId(patient.patient_id);
    setSearchQuery(`${patient.patient_id} - ${patient.name}`);
    setShowPatientDropdown(false);
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

  const getELNResponseStatus = (value: number, months: number): { status: 'optimal' | 'warning' | 'failure' | 'not-assessed', label: string } => {
    if (months < 3) {
      return { status: 'not-assessed', label: 'Not assessed' };
    }
    
    if (months >= 3 && months < 6) {
      if (value <= 10) {
        return { status: 'optimal', label: 'Optimal' };
      } else {
        return { status: 'failure', label: 'Failure' };
      }
    }
    
    if (months >= 6 && months < 12) {
      if (value <= 1) {
        return { status: 'optimal', label: 'Optimal' };
      } else if (value > 1 && value <= 10) {
        return { status: 'warning', label: 'Warning' };
      } else {
        return { status: 'failure', label: 'Failure' };
      }
    }
    
    if (months >= 12) {
      if (value <= 0.1) {
        return { status: 'optimal', label: 'Optimal' };
      } else if (value > 0.1 && value <= 1) {
        return { status: 'warning', label: 'Warning' };
      } else {
        return { status: 'failure', label: 'Failure' };
      }
    }
    
    return { status: 'not-assessed', label: 'Not assessed' };
  };

  const shouldCheckMutation = (value: number, months: number): boolean => {
    // ตาม flowchart: ถ้าไม่ผ่าน milestone ให้ตรวจ mutation
    if (months >= 3 && months < 6) {
      return value > 10; // ไม่ผ่าน milestone 3 เดือน
    }
    if (months >= 6 && months < 12) {
      return value > 1; // ไม่ผ่าน milestone 6 เดือน
    }
    if (months >= 12) {
      return value > 0.1; // ไม่ผ่าน milestone 12 เดือน
    }
    return false;
  };

  const calculateInterpretation = () => {
    // ถ้าไม่ใช่ RQ-PCR for BCR-ABL หรือยังไม่ถึง 3 เดือน ไม่แปลผล
    if (formData.test_type !== 'RQ-PCR for BCR-ABL') {
      setInterpretation(null);
      return;
    }

    if (!selectedPatient || !formData.bcr_abl_is || !formData.test_date) {
      setInterpretation(null);
      return;
    }

    const value = parseFloat(formData.bcr_abl_is);
    if (isNaN(value)) {
      setInterpretation(null);
      return;
    }

    const months = getMonthsSinceDiagnosis(formData.test_date, selectedPatient.diagnosis_date);
    
    // ถ้ายังไม่ถึง 3 เดือน ไม่แปลผล
    if (months < 3) {
      setInterpretation({
        months,
        notReady: true,
      });
      return;
    }

    const color = getCMLColor(value, months);
    const colorName = getCMLColorName(value, months);
    const elnStatus = getELNResponseStatus(value, months);
    const needsMutation = shouldCheckMutation(value, months);

    setInterpretation({
      value,
      months,
      color,
      colorName,
      elnStatus,
      needsMutation,
      notReady: false,
    });
  };

  const renderInterpretation = () => {
    if (!interpretation) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>กรุณาเลือกผู้ป่วยและกรอกข้อมูลเพื่อดูการแปลผล</p>
        </div>
      );
    }
    
    if (interpretation.notReady) {
      return (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-medium">ยังไม่เริ่มแปลผล</p>
          <p className="text-sm mt-2">ผู้ป่วยยังไม่ถึง 3 เดือนนับจากวินิจฉัย ({interpretation.months} เดือน)</p>
          <p className="text-sm mt-1">กรุณารอให้ถึง milestone 3 เดือนก่อน</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className={`p-4 rounded-lg border-2`} style={{ 
          backgroundColor: interpretation.color + '20', 
          borderColor: interpretation.color 
        }}>
          <p className="text-sm text-gray-600">ผลการตรวจ ({interpretation.months} เดือนนับจากวินิจฉัย)</p>
          <p className="text-2xl font-bold" style={{ color: interpretation.color }}>
            {interpretation.value.toFixed(4)}%
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: interpretation.color }}>
            สถานะ: {interpretation.colorName}
            {interpretation.elnStatus.status !== 'not-assessed' && ` (${interpretation.elnStatus.label})`}
          </p>
        </div>

        {/* ELN Status */}
        {interpretation.elnStatus.status !== 'not-assessed' && (
          <div className={`p-3 rounded-lg border-l-4 ${
            interpretation.elnStatus.status === 'optimal' ? 'bg-green-50 border-green-500' :
            interpretation.elnStatus.status === 'warning' ? 'bg-yellow-50 border-yellow-500' :
            'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-2">
              {interpretation.elnStatus.status === 'optimal' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : interpretation.elnStatus.status === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  ELN 2020: {interpretation.elnStatus.label}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {interpretation.months >= 3 && interpretation.months < 6 && `Milestone 3 เดือน: ${String.fromCharCode(8804)}10%`}
                  {interpretation.months >= 6 && interpretation.months < 12 && `Milestone 6 เดือน: ${String.fromCharCode(8804)}1%`}
                  {interpretation.months >= 12 && `Milestone 12 เดือน: ${String.fromCharCode(8804)}0.1%`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mutation Testing Recommendation */}
        {interpretation.needsMutation && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-2">แนะนำให้ตรวจ BCR::ABL1 TKD Mutation</p>
                <p className="text-sm text-red-800">
                  ผู้ป่วยไม่ผ่าน milestone ที่กำหนด ควรพิจารณาตรวจ BCR::ABL1 kinase domain mutation เพื่อวางแผนการรักษาต่อไป
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Treatment Recommendations */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="w-full">
              <h4 className="font-semibold text-blue-900 mb-3">คำแนะนำการรักษาตามสี (NCCN Guidelines)</h4>
              <div className="space-y-3 text-sm">
                {interpretation.colorName === 'RED' ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <p className="font-semibold text-red-900">RED - TKI-resistant disease</p>
                    <p className="text-red-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                    <ul className="list-disc list-inside text-red-700 mt-1 space-y-1">
                      <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                      <li>พิจารณาการตรวจ BCR::ABL1 kinase domain mutation</li>
                      <li>พิจารณาการตรวจ cytogenetic ของไขกระดูกเพื่อประเมิน chromosomal abnormalities เพิ่มเติม</li>
                    </ul>
                    <p className="text-red-800 mt-2"><strong>คำแนะนำ:</strong> เปลี่ยนไปใช้ TKI ตัวอื่น (ไม่ใช่ imatinib) และประเมินความเหมาะสมสำหรับ allogeneic HCT</p>
                  </div>
                ) : null}
                {interpretation.colorName === 'YELLOW' ? (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                    <p className="font-semibold text-yellow-900">YELLOW - Possible TKI resistance</p>
                    <p className="text-yellow-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                    <ul className="list-disc list-inside text-yellow-700 mt-1 space-y-1">
                      <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                      <li>พิจารณาการตรวจ BCR::ABL1 kinase domain mutation</li>
                    </ul>
                    <p className="text-yellow-800 mt-2"><strong>คำแนะนำ:</strong> เปลี่ยนไปใช้ TKI ตัวอื่น หรือ ใช้ TKI เดิมต่อ</p>
                  </div>
                ) : null}
                {interpretation.colorName === 'ORANGE' ? (
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                    <p className="font-semibold text-orange-900">ORANGE - Possible TKI resistance (NEW)</p>
                    <p className="text-orange-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                    <ul className="list-disc list-inside text-orange-700 mt-1 space-y-1">
                      <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                      <li>พิจารณาการตรวจ BCR::ABL1 kinase domain mutation</li>
                      <li>พิจารณาการตรวจ cytogenetic ของไขกระดูกเพื่อประเมิน CCyR ที่ 12 เดือน</li>
                    </ul>
                    <p className="text-orange-800 mt-2"><strong>คำแนะนำ:</strong> พิจารณาเปลี่ยนไปใช้ TKI ตัวอื่น หรือ ใช้ TKI เดิมต่อหากได้ CCyR แล้ว</p>
                  </div>
                ) : null}
                {interpretation.colorName === 'LIGHT GREEN' ? (
                  <div className="bg-lime-50 border-l-4 border-lime-400 p-3 rounded">
                    <p className="font-semibold text-lime-900">LIGHT GREEN - TKI-sensitive disease</p>
                    <p className="text-lime-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                    <ul className="list-disc list-inside text-lime-700 mt-1 space-y-1">
                      <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                      <li>หากเป้าหมายการรักษาคือการอยู่รอดระยะยาว: {String.fromCharCode(8804)}1% เป็นเป้าหมายที่เหมาะสม</li>
                      <li>หากเป้าหมายการรักษาคือ treatment-free remission: {String.fromCharCode(8804)}0.1% เป็นเป้าหมายที่เหมาะสม</li>
                    </ul>
                    <p className="text-lime-800 mt-2"><strong>คำแนะนำ:</strong> หากเหมาะสม: ใช้ TKI เดิมต่อ | หากไม่เหมาะสม: ตัดสินใจร่วมกับผู้ป่วย</p>
                  </div>
                ) : null}
                {interpretation.colorName === 'GREEN' ? (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                    <p className="font-semibold text-green-900">GREEN - TKI-sensitive disease</p>
                    <p className="text-green-800 mt-1"><strong>การพิจารณาทางคลินิก:</strong></p>
                    <ul className="list-disc list-inside text-green-700 mt-1 space-y-1">
                      <li>ประเมินการรับประทานยาของผู้ป่วยและปฏิกิริยาระหว่างยา</li>
                      <li>ติดตามการตอบสนอง (CML-G)</li>
                    </ul>
                    <p className="text-green-800 mt-2"><strong>คำแนะนำ:</strong> ใช้ TKI เดิมต่อ</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (!selectedPatientId) {
      alert('กรุณาเลือกผู้ป่วย');
      return;
    }

    if (formData.test_type === 'RQ-PCR for BCR-ABL' && !formData.bcr_abl_is) {
      alert('กรุณากรอกค่า BCR-ABL1 IS');
      return;
    }

    if (formData.test_type === 'CBC' && !formData.hematologic_response && !formData.cbc_abnormal_values) {
      alert('กรุณากรอกค่า CBC ที่ผิดปกติ');
      return;
    }

    if (formData.test_type === 'chromosome' && !formData.ph_chromosome_percent) {
      alert('กรุณากรอกค่า Ph chromosome %');
      return;
    }

    setSubmitting(true);
    try {
      let status = 'not-assessed';
      let bcr_abl_value = null;

      if (formData.test_type === 'RQ-PCR for BCR-ABL' && formData.bcr_abl_is) {
        const value = parseFloat(formData.bcr_abl_is);
        if (!isNaN(value)) {
          bcr_abl_value = value;
          const months = selectedPatient ? getMonthsSinceDiagnosis(formData.test_date, selectedPatient.diagnosis_date) : 0;
          const elnStatus = getELNResponseStatus(value, months);
          status = elnStatus.status;
        }
      }
      
      const testResultData: any = {
        patient_id: selectedPatientId,
        test_date: formData.test_date,
        test_type: formData.test_type,
        status: status,
      };

      if (bcr_abl_value !== null) {
        testResultData.bcr_abl_is = bcr_abl_value;
      }

      // เพิ่มข้อมูลเพิ่มเติมตามประเภทการตรวจ
      if (formData.test_type === 'CBC') {
        testResultData.hematologic_response = formData.hematologic_response;
        if (formData.cbc_abnormal_values) {
          testResultData.cbc_abnormal_values = formData.cbc_abnormal_values;
        }
      }

      if (formData.test_type === 'chromosome') {
        testResultData.ph_chromosome_percent = parseFloat(formData.ph_chromosome_percent) || null;
        testResultData.chromosome_type = formData.chromosome_type;
        if (formData.other_chromosome) {
          testResultData.other_chromosome = formData.other_chromosome;
        }
      }

      const { error } = await (supabase
        .from('test_results') as any)
        .insert(testResultData);

      if (error) throw error;

      // Generate alerts if RQ-PCR for BCR-ABL
      if (formData.test_type === 'RQ-PCR for BCR-ABL' && bcr_abl_value !== null && selectedPatient) {
        try {
          await generateAlertsForTestResult(
            {
              patient_id: selectedPatientId,
              test_date: formData.test_date,
              bcr_abl_is: bcr_abl_value,
              test_type: formData.test_type,
              status: status,
            },
            {
              patient_id: selectedPatient.patient_id,
              diagnosis_date: selectedPatient.diagnosis_date,
            }
          );
        } catch (alertError) {
          console.error('Error generating alerts:', alertError);
          // Don't fail the save if alert generation fails
        }
      }

      alert('บันทึกผลการตรวจสำเร็จ');
      
      // Reset form
      setFormData({
        test_date: new Date().toISOString().split('T')[0],
        bcr_abl_is: '',
        test_type: 'RQ-PCR for BCR-ABL',
        hematologic_response: false,
        cbc_abnormal_values: '',
        ph_chromosome_percent: '',
        chromosome_type: 'P210',
        other_chromosome: '',
      });
      setSelectedPatientId('');
      setSelectedPatient(null);
      setSearchQuery('');
      setInterpretation(null);
    } catch (error: any) {
      console.error('Error saving test result:', error);
      alert(`เกิดข้อผิดพลาดในการบันทึก: ${error?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {filter === 'recent' ? 'ผลตรวจล่าสุด' : 'ติดตามผล'}
          </h1>
          <p className="text-gray-600 mt-2">
            {filter === 'recent' 
              ? 'ผลการตรวจ RQ-PCR for BCR-ABL ใน 30 วันที่ผ่านมา' 
              : 'กรอกผลการตรวจและดูการแปลผลตาม ELN และ NCCN'}
          </p>
        </div>

        {filter === 'recent' ? (
          <div>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : recentTests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  ไม่พบผลตรวจล่าสุด
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentTests.map((test) => (
                  <Card key={test.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <TestTube className="w-5 h-5 text-green-600" />
                            <h3 className="font-semibold text-gray-900">
                              {test.patient?.name || 'ไม่ทราบชื่อ'} ({test.patient?.patient_id || test.patient_id})
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500">วันที่ตรวจ</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(test.test_date).toLocaleDateString('th-TH')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">BCR-ABL1 IS (%)</p>
                              <p className="text-sm font-medium text-gray-900">
                                {test.bcr_abl_is?.toFixed(4) || '-'}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">ประเภทการตรวจ</p>
                              <p className="text-sm font-medium text-gray-900">
                                {test.test_type || '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">สถานะ</p>
                              <p className="text-sm font-medium text-gray-900">
                                {test.status || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                กรอกผลการตรวจ
              </CardTitle>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div ref={searchRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกผู้ป่วย *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (!e.target.value) {
                          setSelectedPatientId('');
                          setSelectedPatient(null);
                        }
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="ค้นหา HN หรือชื่อผู้ป่วย..."
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedPatientId('');
                          setSelectedPatient(null);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {showPatientDropdown && filteredPatients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handlePatientSelect(patient)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <div className="font-medium">{patient.patient_id} - {patient.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedPatient && (
                    <p className="text-sm text-gray-500 mt-1">
                      วันที่วินิจฉัย: {new Date(selectedPatient.diagnosis_date).toLocaleDateString('th-TH')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่ตรวจ *
                  </label>
                  <input
                    type="date"
                    value={formData.test_date}
                    onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
          </div>

          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภทการตรวจ *
                  </label>
                  <select
                    value={formData.test_type}
                    onChange={(e) => {
                      setFormData({ ...formData, test_type: e.target.value });
                      setInterpretation(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="RQ-PCR for BCR-ABL">RQ-PCR for BCR-ABL</option>
                    <option value="CBC">CBC</option>
                    <option value="chromosome">chromosome</option>
                  </select>
                </div>

                {/* RQ-PCR for BCR-ABL Fields */}
                {formData.test_type === 'RQ-PCR for BCR-ABL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BCR-ABL1 IS (%) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.bcr_abl_is}
                      onChange={(e) => {
                        setFormData({ ...formData, bcr_abl_is: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.0000"
                      required
                    />
                  </div>
                )}

                {/* CBC Fields */}
                {formData.test_type === 'CBC' && (
                  <>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="hematologic_response"
                        checked={formData.hematologic_response}
                        onChange={(e) => setFormData({ ...formData, hematologic_response: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="hematologic_response" className="ml-2 text-sm font-medium text-gray-700">
                        Hematologic Response
                      </label>
                    </div>
                    {!formData.hematologic_response && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ค่า CBC ที่ผิดปกติ *
                        </label>
                        <textarea
                          value={formData.cbc_abnormal_values}
                          onChange={(e) => setFormData({ ...formData, cbc_abnormal_values: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="เช่น WBC: 50,000, Platelet: 800,000"
                          rows={3}
                          required={!formData.hematologic_response}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Chromosome Fields */}
                {formData.test_type === 'chromosome' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ph chromosome + (%) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.ph_chromosome_percent}
                        onChange={(e) => setFormData({ ...formData, ph_chromosome_percent: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ประเภท Chromosome
                      </label>
                      <select
                        value={formData.chromosome_type}
                        onChange={(e) => setFormData({ ...formData, chromosome_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="P210">P210</option>
                        <option value="P190">P190</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                    {formData.chromosome_type === 'other' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chromosome อื่นๆ
                        </label>
                        <input
                          type="text"
                          value={formData.other_chromosome}
                          onChange={(e) => setFormData({ ...formData, other_chromosome: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="ระบุประเภท chromosome"
                        />
                      </div>
                    )}
                  </>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกผลการตรวจ'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Interpretation Section */}
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                การแปลผล
              </CardTitle>
              </CardHeader>
              <CardContent>
              {renderInterpretation()}
              </CardContent>
            </Card>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}
