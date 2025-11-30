'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import DoctorLayout from '@/components/doctor/DoctorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Search, Plus, Edit, X, TestTube, Pill, FileEdit, QrCode, Eye, Calculator, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateAlertsForTestResult } from '@/lib/alerts';
import PatientQRCode from '@/components/admin/PatientQRCode';
import PatientDetailModal from '@/components/admin/PatientDetailModal';
import { calculateAllRiskScores } from '@/lib/risk-scores';

interface Hospital {
  id: string;
  name: string;
}

interface Patient {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis_date: string;
  hospital_id?: string;
  current_tki?: string;
  phase: string;
  baseline_rq_pcr_bcr_abl_positive?: boolean | null;
  baseline_rq_pcr_bcr_abl_type?: string | null;
  baseline_rq_pcr_bcr_abl_other?: string | null;
  baseline_bm_chromosome?: string | null;
  baseline_bm_ph_percent?: number | null;
  baseline_bm_blast_percent?: number | null;
  baseline_cbc_hb?: number | null;
  baseline_cbc_hct?: number | null;
  baseline_cbc_wbc?: number | null;
  baseline_cbc_neutrophil?: number | null;
  baseline_cbc_lymphocyte?: number | null;
  baseline_cbc_basophil?: number | null;
  baseline_cbc_eosinophil?: number | null;
  baseline_cbc_myelocyte?: number | null;
  baseline_cbc_promyelocyte?: number | null;
  baseline_cbc_metamyelocyte?: number | null;
  baseline_cbc_band?: number | null;
  baseline_cbc_blast?: number | null;
  baseline_cbc_platelet?: number | null;
  baseline_spleen_size?: number | null;
  baseline_other_sign_symptom?: string | null;
  sokal_score?: number | null;
  hasford_score?: number | null;
  elts_score?: number | null;
  hospital?: Hospital;
  next_appointment_date?: string;
  next_appointment_notes?: string;
  next_rq_pcr_date_range_start?: string;
  next_rq_pcr_date_range_end?: string;
}

interface Hospital {
  id: string;
  name: string;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showScoreInfo, setShowScoreInfo] = useState<'sokal' | 'hasford' | 'elts' | null>(null);
  
  // Modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showRQPCRModal, setShowRQPCRModal] = useState(false);
  const [showTKIModal, setShowTKIModal] = useState(false);
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Form data
  const [patientFormData, setPatientFormData] = useState({
    patient_id: '',
    name: '',
    age: '',
    gender: 'male',
    diagnosis_date: '',
    hospital_id: '',
    current_tki: 'imatinib',
    phase: 'chronic',
    baseline_rq_pcr_bcr_abl_positive: '',
    baseline_rq_pcr_bcr_abl_type: '',
    baseline_rq_pcr_bcr_abl_other: '',
    baseline_bm_chromosome: '',
    baseline_bm_ph_percent: '',
    baseline_bm_blast_percent: '',
    baseline_cbc_hb: '',
    baseline_cbc_hct: '',
    baseline_cbc_wbc: '',
    baseline_cbc_neutrophil: '',
    baseline_cbc_lymphocyte: '',
    baseline_cbc_basophil: '',
    baseline_cbc_eosinophil: '',
    baseline_cbc_myelocyte: '',
    baseline_cbc_promyelocyte: '',
    baseline_cbc_metamyelocyte: '',
    baseline_cbc_band: '',
    baseline_cbc_blast: '',
    baseline_cbc_platelet: '',
    baseline_spleen_size: '',
    baseline_other_sign_symptom: '',
    sokal_score: '',
    hasford_score: '',
    elts_score: '',
    next_appointment_date: '',
    next_appointment_notes: '',
    next_rq_pcr_date_range_start: '',
    next_rq_pcr_date_range_end: '',
  });
  
  const [rqPCRFormData, setRQPCRFormData] = useState({
    test_date: new Date().toISOString().split('T')[0],
    bcr_abl_is: '',
  });
  
  const [tkiFormData, setTkiFormData] = useState({
    new_tki: 'nilotinib',
    reason: 'molecularFailure',
    mutation_test_result: '',
    notes: '',
    start_date: new Date().toISOString().split('T')[0],
  });
  
  const [mutationFormData, setMutationFormData] = useState({
    test_date: new Date().toISOString().split('T')[0],
    mutation_result: '',
    notes: '',
  });

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = patients.filter(
        (p) =>
          p.patient_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [searchQuery, patients]);

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      // Keep dropdown open for search
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, hospitalsRes] = await Promise.all([
        (supabase
          .from('patients') as any)
          .select(`
            *,
            hospital:hospitals(*)
          `)
          .order('created_at', { ascending: false }),
        (supabase
          .from('hospitals') as any)
          .select('*')
          .order('name'),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (hospitalsRes.error) throw hospitalsRes.error;

      setPatients(patientsRes.data || []);
      setFilteredPatients(patientsRes.data || []);
      setHospitals(hospitalsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setSelectedPatient(null);
    setPatientFormData({
      patient_id: '',
      name: '',
      age: '',
      gender: 'male',
      diagnosis_date: '',
      hospital_id: '',
      current_tki: 'imatinib',
      phase: 'chronic',
      baseline_rq_pcr_bcr_abl_positive: '',
      baseline_rq_pcr_bcr_abl_type: '',
      baseline_rq_pcr_bcr_abl_other: '',
      baseline_bm_chromosome: '',
      baseline_bm_ph_percent: '',
      baseline_bm_blast_percent: '',
      baseline_cbc_hb: '',
      baseline_cbc_hct: '',
      baseline_cbc_wbc: '',
      baseline_cbc_neutrophil: '',
      baseline_cbc_lymphocyte: '',
      baseline_cbc_basophil: '',
      baseline_cbc_eosinophil: '',
      baseline_cbc_myelocyte: '',
      baseline_cbc_promyelocyte: '',
      baseline_cbc_metamyelocyte: '',
      baseline_cbc_band: '',
      baseline_cbc_blast: '',
      baseline_cbc_platelet: '',
      baseline_spleen_size: '',
      baseline_other_sign_symptom: '',
      sokal_score: '',
      hasford_score: '',
      elts_score: '',
      next_appointment_date: '',
      next_appointment_notes: '',
      next_rq_pcr_date_range_start: '',
      next_rq_pcr_date_range_end: '',
    });
    setShowPatientModal(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setSelectedPatient(patient);
    setPatientFormData({
      patient_id: patient.patient_id,
      name: patient.name,
      age: patient.age.toString(),
      gender: patient.gender,
      diagnosis_date: patient.diagnosis_date,
      hospital_id: patient.hospital_id || '',
      current_tki: patient.current_tki || 'imatinib',
      phase: patient.phase,
      baseline_rq_pcr_bcr_abl_positive: patient.baseline_rq_pcr_bcr_abl_positive === true ? 'true' : patient.baseline_rq_pcr_bcr_abl_positive === false ? 'false' : '',
      baseline_rq_pcr_bcr_abl_type: patient.baseline_rq_pcr_bcr_abl_type || '',
      baseline_rq_pcr_bcr_abl_other: patient.baseline_rq_pcr_bcr_abl_other || '',
      baseline_bm_chromosome: patient.baseline_bm_chromosome || '',
      baseline_bm_ph_percent: patient.baseline_bm_ph_percent?.toString() || '',
      baseline_bm_blast_percent: patient.baseline_bm_blast_percent?.toString() || '',
      baseline_cbc_hb: patient.baseline_cbc_hb?.toString() || '',
      baseline_cbc_hct: patient.baseline_cbc_hct?.toString() || '',
      baseline_cbc_wbc: patient.baseline_cbc_wbc?.toString() || '',
      baseline_cbc_neutrophil: patient.baseline_cbc_neutrophil?.toString() || '',
      baseline_cbc_lymphocyte: patient.baseline_cbc_lymphocyte?.toString() || '',
      baseline_cbc_basophil: patient.baseline_cbc_basophil?.toString() || '',
      baseline_cbc_eosinophil: patient.baseline_cbc_eosinophil?.toString() || '',
      baseline_cbc_myelocyte: patient.baseline_cbc_myelocyte?.toString() || '',
      baseline_cbc_promyelocyte: patient.baseline_cbc_promyelocyte?.toString() || '',
      baseline_cbc_metamyelocyte: patient.baseline_cbc_metamyelocyte?.toString() || '',
      baseline_cbc_band: patient.baseline_cbc_band?.toString() || '',
      baseline_cbc_blast: patient.baseline_cbc_blast?.toString() || '',
      baseline_cbc_platelet: patient.baseline_cbc_platelet?.toString() || '',
      baseline_spleen_size: patient.baseline_spleen_size?.toString() || '',
      baseline_other_sign_symptom: patient.baseline_other_sign_symptom || '',
      sokal_score: patient.sokal_score?.toString() || '',
      hasford_score: patient.hasford_score?.toString() || '',
      elts_score: patient.elts_score?.toString() || '',
      next_appointment_date: patient.next_appointment_date || '',
      next_appointment_notes: patient.next_appointment_notes || '',
      next_rq_pcr_date_range_start: patient.next_rq_pcr_date_range_start || '',
      next_rq_pcr_date_range_end: patient.next_rq_pcr_date_range_end || '',
    });
    setShowPatientModal(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...patientFormData,
        age: parseInt(patientFormData.age),
        baseline_rq_pcr_bcr_abl_positive: patientFormData.baseline_rq_pcr_bcr_abl_positive === 'true' ? true : patientFormData.baseline_rq_pcr_bcr_abl_positive === 'false' ? false : null,
        baseline_rq_pcr_bcr_abl_type: patientFormData.baseline_rq_pcr_bcr_abl_type || null,
        baseline_rq_pcr_bcr_abl_other: patientFormData.baseline_rq_pcr_bcr_abl_other || null,
        baseline_bm_chromosome: patientFormData.baseline_bm_chromosome || null,
        baseline_bm_ph_percent: patientFormData.baseline_bm_ph_percent
          ? parseFloat(patientFormData.baseline_bm_ph_percent)
          : null,
        baseline_bm_blast_percent: patientFormData.baseline_bm_blast_percent
          ? parseFloat(patientFormData.baseline_bm_blast_percent)
          : null,
        baseline_cbc_hb: patientFormData.baseline_cbc_hb ? parseFloat(patientFormData.baseline_cbc_hb) : null,
        baseline_cbc_hct: patientFormData.baseline_cbc_hct ? parseFloat(patientFormData.baseline_cbc_hct) : null,
        baseline_cbc_wbc: patientFormData.baseline_cbc_wbc ? parseFloat(patientFormData.baseline_cbc_wbc) : null,
        baseline_cbc_neutrophil: patientFormData.baseline_cbc_neutrophil ? parseFloat(patientFormData.baseline_cbc_neutrophil) : null,
        baseline_cbc_lymphocyte: patientFormData.baseline_cbc_lymphocyte ? parseFloat(patientFormData.baseline_cbc_lymphocyte) : null,
        baseline_cbc_basophil: patientFormData.baseline_cbc_basophil ? parseFloat(patientFormData.baseline_cbc_basophil) : null,
        baseline_cbc_eosinophil: patientFormData.baseline_cbc_eosinophil ? parseFloat(patientFormData.baseline_cbc_eosinophil) : null,
        baseline_cbc_myelocyte: patientFormData.baseline_cbc_myelocyte ? parseFloat(patientFormData.baseline_cbc_myelocyte) : null,
        baseline_cbc_promyelocyte: patientFormData.baseline_cbc_promyelocyte ? parseFloat(patientFormData.baseline_cbc_promyelocyte) : null,
        baseline_cbc_metamyelocyte: patientFormData.baseline_cbc_metamyelocyte ? parseFloat(patientFormData.baseline_cbc_metamyelocyte) : null,
        baseline_cbc_band: patientFormData.baseline_cbc_band ? parseFloat(patientFormData.baseline_cbc_band) : null,
        baseline_cbc_blast: patientFormData.baseline_cbc_blast ? parseFloat(patientFormData.baseline_cbc_blast) : null,
        baseline_cbc_platelet: patientFormData.baseline_cbc_platelet ? parseFloat(patientFormData.baseline_cbc_platelet) : null,
        baseline_spleen_size: patientFormData.baseline_spleen_size ? parseFloat(patientFormData.baseline_spleen_size) : null,
        sokal_score: patientFormData.sokal_score ? parseFloat(patientFormData.sokal_score) : null,
        hasford_score: patientFormData.hasford_score ? parseFloat(patientFormData.hasford_score) : null,
        elts_score: patientFormData.elts_score ? parseFloat(patientFormData.elts_score) : null,
        hospital_id: patientFormData.hospital_id || null,
        next_appointment_date: patientFormData.next_appointment_date || null,
        next_appointment_notes: patientFormData.next_appointment_notes || null,
        next_rq_pcr_date_range_start: patientFormData.next_rq_pcr_date_range_start || null,
        next_rq_pcr_date_range_end: patientFormData.next_rq_pcr_date_range_end || null,
      };

      if (editingPatient) {
        const { error } = await (supabase
          .from('patients') as any)
          .update(submitData)
          .eq('id', editingPatient.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('patients') as any).insert([submitData]);
        if (error) throw error;
      }

      setShowPatientModal(false);
      fetchData();
      alert('บันทึกข้อมูลผู้ป่วยสำเร็จ');
    } catch (error: any) {
      if (error.code === '23505') {
        alert('รหัสผู้ป่วยนี้มีอยู่แล้ว');
      } else {
        alert('เกิดข้อผิดพลาด');
        console.error(error);
      }
    }
  };

  const handleOpenRQPCR = (patient: Patient) => {
    setSelectedPatient(patient);
    setRQPCRFormData({
      test_date: new Date().toISOString().split('T')[0],
      bcr_abl_is: '',
    });
    setShowRQPCRModal(true);
  };

  const handleSaveRQPCR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !rqPCRFormData.bcr_abl_is) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      const value = parseFloat(rqPCRFormData.bcr_abl_is);
      if (isNaN(value)) {
        alert('กรุณากรอกตัวเลขที่ถูกต้อง');
        return;
      }

      const months = getMonthsSinceDiagnosis(rqPCRFormData.test_date, selectedPatient.diagnosis_date);
      const status = getELNResponseStatus(value, months).status;

      const testResultData: any = {
        patient_id: selectedPatient.patient_id,
        test_date: rqPCRFormData.test_date,
        test_type: 'RQ-PCR for BCR-ABL',
        bcr_abl_is: value,
        status: status,
      };

      const { error } = await (supabase.from('test_results') as any).insert(testResultData);
      if (error) throw error;

      // Generate alerts
      try {
        await generateAlertsForTestResult(
          {
            patient_id: selectedPatient.patient_id,
            test_date: rqPCRFormData.test_date,
            bcr_abl_is: value,
            test_type: 'RQ-PCR for BCR-ABL',
            status: status,
          },
          {
            patient_id: selectedPatient.patient_id,
            diagnosis_date: selectedPatient.diagnosis_date,
          }
        );
      } catch (alertError) {
        console.error('Error generating alerts:', alertError);
      }

      setShowRQPCRModal(false);
      alert('บันทึกผลการตรวจ RQ PCR for BCR ABL สำเร็จ');
    } catch (error: any) {
      console.error('Error saving RQ PCR:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error'));
    }
  };

  const handleOpenTKI = (patient: Patient) => {
    setSelectedPatient(patient);
    setTkiFormData({
      new_tki: 'nilotinib',
      reason: 'molecularFailure',
      mutation_test_result: '',
      notes: '',
      start_date: new Date().toISOString().split('T')[0],
    });
    setShowTKIModal(true);
  };

  const handleSaveTKI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('กรุณาเลือกผู้ป่วย');
      return;
    }

    try {
      // End current TKI record if exists
      await (supabase
        .from('tki_records') as any)
        .update({ end_date: tkiFormData.start_date })
        .eq('patient_id', selectedPatient.patient_id)
        .is('end_date', null);

      // Create new TKI record
      const { error } = await (supabase.from('tki_records') as any).insert([
        {
          patient_id: selectedPatient.patient_id,
          tki_name: tkiFormData.new_tki,
          start_date: tkiFormData.start_date,
          reason: tkiFormData.reason,
          mutation_test_result: tkiFormData.mutation_test_result || null,
          notes: tkiFormData.notes || null,
        },
      ]);

      if (error) throw error;

      // Update patient's current TKI
      await (supabase
        .from('patients') as any)
        .update({ current_tki: tkiFormData.new_tki })
        .eq('patient_id', selectedPatient.patient_id);

      setShowTKIModal(false);
      fetchData();
      alert('บันทึกการเปลี่ยนยา TKI สำเร็จ');
    } catch (error: any) {
      console.error('Error saving TKI switch:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error'));
    }
  };

  const handleOpenMutation = (patient: Patient) => {
    setSelectedPatient(patient);
    setMutationFormData({
      test_date: new Date().toISOString().split('T')[0],
      mutation_result: '',
      notes: '',
    });
    setShowMutationModal(true);
  };

  const handleSaveMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !mutationFormData.mutation_result) {
      alert('กรุณากรอกผลการตรวจ mutation');
      return;
    }

    try {
      // Update the latest TKI record with mutation result
      const { data: tkiRecords } = await (supabase
        .from('tki_records') as any)
        .select('*')
        .eq('patient_id', selectedPatient.patient_id)
        .order('start_date', { ascending: false })
        .limit(1);

      if (tkiRecords && tkiRecords.length > 0) {
        await (supabase
          .from('tki_records') as any)
          .update({
            mutation_test_result: mutationFormData.mutation_result,
            notes: mutationFormData.notes || null,
          })
          .eq('id', tkiRecords[0].id);
      } else {
        // If no TKI record, create one
        await (supabase.from('tki_records') as any).insert([
          {
            patient_id: selectedPatient.patient_id,
            tki_name: selectedPatient.current_tki || 'imatinib',
            start_date: mutationFormData.test_date,
            reason: 'molecularFailure',
            mutation_test_result: mutationFormData.mutation_result,
            notes: mutationFormData.notes || null,
          },
        ]);
      }

      setShowMutationModal(false);
      fetchData();
      alert('บันทึกผลการตรวจ Mutation สำเร็จ');
    } catch (error: any) {
      console.error('Error saving mutation:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error'));
    }
  };

  const getMonthsSinceDiagnosis = (testDate: string, diagnosisDate: string): number => {
    const test = new Date(testDate);
    const diagnosis = new Date(diagnosisDate);
    const diffTime = test.getTime() - diagnosis.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ป่วย</h1>
            <p className="text-gray-600 mt-2">ค้นหา เพิ่ม แก้ไข และลงข้อมูลผู้ป่วย</p>
          </div>
          <Button onClick={handleAddPatient} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            เพิ่มผู้ป่วยใหม่
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div ref={searchRef} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="ค้นหาด้วยรหัสผู้ป่วยหรือชื่อ..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <Card>
          <CardHeader>
            <CardTitle>รายการผู้ป่วย</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'ไม่พบผู้ป่วยที่ค้นหา' : 'ยังไม่มีผู้ป่วยในระบบ'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">รหัสผู้ป่วย</th>
                      <th className="text-left p-3">ชื่อ</th>
                      <th className="text-left p-3">อายุ</th>
                      <th className="text-left p-3">โรงพยาบาล</th>
                      <th className="text-left p-3">TKI ปัจจุบัน</th>
                      <th className="text-left p-3">ระยะโรค</th>
                      <th className="text-right p-3">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <motion.tr
                        key={patient.id}
                        className="border-b hover:bg-gray-50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="p-3 font-mono text-sm">{patient.patient_id}</td>
                        <td className="p-3">{patient.name}</td>
                        <td className="p-3">{patient.age}</td>
                        <td className="p-3">{patient.hospital?.name || '-'}</td>
                        <td className="p-3">{patient.current_tki || '-'}</td>
                        <td className="p-3">{patient.phase}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setIsQRModalOpen(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="ดู QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditPatient(patient)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenRQPCR(patient)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="ลงข้อมูล RQ PCR"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenTKI(patient)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                              title="ลงข้อมูลเปลี่ยนยา TKI"
                            >
                              <Pill className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenMutation(patient)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                              title="ลงข้อมูล Mutation"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Modal */}
        {showPatientModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingPatient ? 'แก้ไขผู้ป่วย' : 'เพิ่มผู้ป่วยใหม่'}
                </h2>
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSavePatient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รหัสผู้ป่วย *
                    </label>
                    <input
                      type="text"
                      value={patientFormData.patient_id}
                      onChange={(e) =>
                        setPatientFormData({ ...patientFormData, patient_id: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 bg-white text-gray-900"
                      required
                      disabled={!!editingPatient}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ *
                    </label>
                    <input
                      type="text"
                      value={patientFormData.name}
                      onChange={(e) =>
                        setPatientFormData({ ...patientFormData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อายุ *
                    </label>
                    <input
                      type="number"
                      value={patientFormData.age}
                      onChange={(e) =>
                        setPatientFormData({ ...patientFormData, age: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เพศ *
                    </label>
                    <select
                      value={patientFormData.gender}
                      onChange={(e) =>
                        setPatientFormData({ ...patientFormData, gender: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    >
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันที่วินิจฉัย *
                    </label>
                    <input
                      type="date"
                      value={patientFormData.diagnosis_date}
                      onChange={(e) =>
                        setPatientFormData({ ...patientFormData, diagnosis_date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                {/* Baseline clinical data */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลก่อนเริ่มการรักษา (Baseline)</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RT PCR for BCR-ABL (ครั้งแรก)
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">ผลการตรวจ</label>
                        <select
                          value={patientFormData.baseline_rq_pcr_bcr_abl_positive}
                          onChange={(e) =>
                            setPatientFormData({ 
                              ...patientFormData, 
                              baseline_rq_pcr_bcr_abl_positive: e.target.value,
                              baseline_rq_pcr_bcr_abl_type: e.target.value === 'true' ? patientFormData.baseline_rq_pcr_bcr_abl_type : '',
                              baseline_rq_pcr_bcr_abl_other: e.target.value === 'true' ? patientFormData.baseline_rq_pcr_bcr_abl_other : '',
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        >
                          <option value="">เลือก</option>
                          <option value="true">Positive</option>
                          <option value="false">Negative</option>
                        </select>
                      </div>
                      {patientFormData.baseline_rq_pcr_bcr_abl_positive === 'true' && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">ประเภท</label>
                            <select
                              value={patientFormData.baseline_rq_pcr_bcr_abl_type}
                              onChange={(e) =>
                                setPatientFormData({ 
                                  ...patientFormData, 
                                  baseline_rq_pcr_bcr_abl_type: e.target.value,
                                  baseline_rq_pcr_bcr_abl_other: e.target.value !== 'other' ? '' : patientFormData.baseline_rq_pcr_bcr_abl_other,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                            >
                              <option value="">เลือก</option>
                              <option value="P190">P190</option>
                              <option value="P210">P210</option>
                              <option value="other">อื่นๆ</option>
                            </select>
                          </div>
                          {patientFormData.baseline_rq_pcr_bcr_abl_type === 'other' && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">ระบุประเภท</label>
                              <input
                                type="text"
                                value={patientFormData.baseline_rq_pcr_bcr_abl_other}
                                onChange={(e) =>
                                  setPatientFormData({ ...patientFormData, baseline_rq_pcr_bcr_abl_other: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                                placeholder="ระบุประเภท"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BM Chromosome
                    </label>
                    <textarea
                      value={patientFormData.baseline_bm_chromosome}
                      onChange={(e) =>
                        setPatientFormData({ ...patientFormData, baseline_bm_chromosome: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      placeholder="เช่น t(9;22)(q34;q11), +8, -7 ฯลฯ (กรอกหลายตัวได้)"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      กรอกข้อมูล chromosome ผิดปกติหลายตัวได้
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        BM Chromosome Ph+ (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={patientFormData.baseline_bm_ph_percent}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, baseline_bm_ph_percent: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="เช่น 100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        BM study : blast (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={patientFormData.baseline_bm_blast_percent}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, baseline_bm_blast_percent: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="เช่น 2"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spleen size (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={patientFormData.baseline_spleen_size}
                      onChange={(e) =>
                        setPatientFormData({ ...patientFormData, baseline_spleen_size: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      placeholder="เช่น 5.0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">กรอกเป็นตัวเลข cm เท่านั้น</p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CBC แรกรับ
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hb (g/dL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_hb}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_hb: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 12.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Hct (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_hct}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_hct: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 38.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">WBC (x10⁹/L)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={patientFormData.baseline_cbc_wbc}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_wbc: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 50.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Neutrophil (N) (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_neutrophil}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_neutrophil: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 60.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Lymphocyte (L) (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_lymphocyte}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_lymphocyte: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 30.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Basophil (Ba) (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_basophil}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_basophil: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 3.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Eosinophil (Eo) (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_eosinophil}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_eosinophil: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 2.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Myelocyte (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_myelocyte}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_myelocyte: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 5.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Promyelocyte (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_promyelocyte}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_promyelocyte: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 2.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Metamyelocyte (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_metamyelocyte}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_metamyelocyte: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 3.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Band (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_band}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_band: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 4.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Blast (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={patientFormData.baseline_cbc_blast}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_blast: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 2.0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Platelet (plt) (x10⁹/L)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={patientFormData.baseline_cbc_platelet}
                          onChange={(e) =>
                            setPatientFormData({ ...patientFormData, baseline_cbc_platelet: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 text-sm"
                          placeholder="เช่น 800.0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other sign and symptom
                    </label>
                    <textarea
                      value={patientFormData.baseline_other_sign_symptom}
                      onChange={(e) =>
                        setPatientFormData({
                          ...patientFormData,
                          baseline_other_sign_symptom: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      placeholder="เช่น ซีด, เลือดออกง่าย, น้ำหนักลด, เหงื่อกลางคืน ฯลฯ"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Risk scoring systems */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Risk Scoring Systems
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Parse data from form
                        const age = parseInt(patientFormData.age) || 0;
                        const spleenSize = parseFloat(patientFormData.baseline_spleen_size) || 0;
                        const platelet = parseFloat(patientFormData.baseline_cbc_platelet) || 450;
                        const blast = parseFloat(patientFormData.baseline_cbc_blast) || 0;
                        const basophil = parseFloat(patientFormData.baseline_cbc_basophil) || 0;
                        const eosinophil = parseFloat(patientFormData.baseline_cbc_eosinophil) || 0;
                        
                        // Calculate scores
                        const scores = calculateAllRiskScores({
                          age,
                          spleenSize,
                          platelet,
                          blast,
                          basophil,
                          eosinophil,
                        });
                        
                        // Update form data
                        setPatientFormData({
                          ...patientFormData,
                          sokal_score: scores.sokal.toString(),
                          hasford_score: scores.hasford.toString(),
                          elts_score: scores.elts.toString(),
                        });
                      }}
                      className="flex items-center gap-2"
                    >
                      <Calculator className="w-4 h-4" />
                      คำนวณอัตโนมัติ
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    คำนวณอัตโนมัติจากข้อมูล baseline ที่กรอกมา หรือกรอกค่าเองได้
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Sokal Score
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowScoreInfo(showScoreInfo === 'sokal' ? null : 'sokal')}
                          className="text-green-600 hover:text-green-800"
                          title="ดูรายละเอียด"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      {showScoreInfo === 'sokal' && (
                        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-gray-700">
                          <p className="font-semibold mb-1">Sokal Score (1984)</p>
                          <p className="mb-1">ใช้ค่าจาก:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>อายุ (ปี)</li>
                            <li>Spleen size (cm)</li>
                            <li>Platelet (x10⁹/L)</li>
                            <li>Blast (%)</li>
                          </ul>
                          <p className="mt-1 text-xs text-gray-600">Risk: &lt;0.8 (low), 0.8-1.2 (intermediate), &gt;1.2 (high)</p>
                        </div>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={patientFormData.sokal_score}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, sokal_score: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="เช่น 0.85"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Hasford (Euro) Score
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowScoreInfo(showScoreInfo === 'hasford' ? null : 'hasford')}
                          className="text-green-600 hover:text-green-800"
                          title="ดูรายละเอียด"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      {showScoreInfo === 'hasford' && (
                        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-gray-700">
                          <p className="font-semibold mb-1">Hasford Score / Euro Score (1998)</p>
                          <p className="mb-1">ใช้ค่าจาก:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>อายุ ≥50 ปี</li>
                            <li>Spleen size (cm)</li>
                            <li>Platelet ≥1500 (x10⁹/L)</li>
                            <li>Blast (%)</li>
                            <li>Basophil ≥3% (%)</li>
                            <li>Eosinophil ≥7% (%)</li>
                          </ul>
                          <p className="mt-1 text-xs text-gray-600">Risk: ≤780 (low), 781-1480 (intermediate), &gt;1480 (high)</p>
                        </div>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={patientFormData.hasford_score}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, hasford_score: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="เช่น 780"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          EUTOS Long-Term Survival (ELTS) Score
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowScoreInfo(showScoreInfo === 'elts' ? null : 'elts')}
                          className="text-green-600 hover:text-green-800"
                          title="ดูรายละเอียด"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                      {showScoreInfo === 'elts' && (
                        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-gray-700">
                          <p className="font-semibold mb-1">ELTS Score (2016)</p>
                          <p className="mb-1">ใช้ค่าจาก:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>อายุ (ปี)</li>
                            <li>Spleen size (cm)</li>
                            <li>Platelet (x10⁹/L)</li>
                            <li>Blast (%)</li>
                          </ul>
                          <p className="mt-1 text-xs text-gray-600">Risk: ≤1.5680 (low), 1.5681-2.2185 (intermediate), &gt;2.2185 (high)</p>
                        </div>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={patientFormData.elts_score}
                        onChange={(e) =>
                          setPatientFormData({ ...patientFormData, elts_score: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="เช่น 1.25"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    โรงพยาบาล
                  </label>
                  <select
                    value={patientFormData.hospital_id}
                    onChange={(e) => setPatientFormData({ ...patientFormData, hospital_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">เลือกโรงพยาบาล</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TKI ปัจจุบัน
                    </label>
                    <select
                      value={patientFormData.current_tki}
                      onChange={(e) => setPatientFormData({ ...patientFormData, current_tki: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    >
                      <option value="imatinib">Imatinib</option>
                      <option value="nilotinib">Nilotinib</option>
                      <option value="dasatinib">Dasatinib</option>
                      <option value="ponatinib">Ponatinib</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ระยะโรค
                    </label>
                    <select
                      value={patientFormData.phase}
                      onChange={(e) => setPatientFormData({ ...patientFormData, phase: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    >
                      <option value="chronic">ระยะเรื้อรัง</option>
                      <option value="accelerated">ระยะเร่ง</option>
                      <option value="blast">ระยะวิกฤติ</option>
                    </select>
                  </div>
                </div>
                
                {/* Appointment & RQ-PCR Fields */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">การนัดหมายและการวางแผน</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันนัดครั้งต่อไป
                      </label>
                      <input
                        type="date"
                        value={patientFormData.next_appointment_date}
                        onChange={(e) => setPatientFormData({ ...patientFormData, next_appointment_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่เริ่มต้นช่วงเจาะ RQ-PCR
                      </label>
                      <input
                        type="date"
                        value={patientFormData.next_rq_pcr_date_range_start}
                        onChange={(e) => setPatientFormData({ ...patientFormData, next_rq_pcr_date_range_start: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่สิ้นสุดช่วงเจาะ RQ-PCR
                      </label>
                      <input
                        type="date"
                        value={patientFormData.next_rq_pcr_date_range_end}
                        onChange={(e) => setPatientFormData({ ...patientFormData, next_rq_pcr_date_range_end: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หมายเหตุจากแพทย์สำหรับนัดครั้งหน้า
                    </label>
                    <textarea
                      value={patientFormData.next_appointment_notes}
                      onChange={(e) => setPatientFormData({ ...patientFormData, next_appointment_notes: e.target.value })}
                      placeholder="เช่น: เจาะเลือด, BM, หัตถการอื่นๆ..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      หมายเหตุนี้จะแสดงให้ผู้ป่วยเห็น (เช่น: เจาะเลือด, BM, หัตถการอื่นๆ)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowPatientModal(false)}
                    variant="outline"
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">
                    {editingPatient ? 'บันทึก' : 'เพิ่ม'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* RQ PCR Modal */}
        {showRQPCRModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">ลงข้อมูล RQ PCR for BCR ABL</h2>
                <button
                  onClick={() => setShowRQPCRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">ผู้ป่วย: {selectedPatient.name}</p>
                <p className="text-xs text-blue-700">รหัส: {selectedPatient.patient_id}</p>
              </div>

              <form onSubmit={handleSaveRQPCR} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่ตรวจ *
                  </label>
                  <input
                    type="date"
                    value={rqPCRFormData.test_date}
                    onChange={(e) =>
                      setRQPCRFormData({ ...rqPCRFormData, test_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ค่า BCR-ABL1 IS (%) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={rqPCRFormData.bcr_abl_is}
                    onChange={(e) =>
                      setRQPCRFormData({ ...rqPCRFormData, bcr_abl_is: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="เช่น 0.0523"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowRQPCRModal(false)}
                    variant="outline"
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึก</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* TKI Switch Modal */}
        {showTKIModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">ลงข้อมูลการเปลี่ยนยา TKI</h2>
                <button
                  onClick={() => setShowTKIModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">ผู้ป่วย: {selectedPatient.name}</p>
                <p className="text-xs text-purple-700">TKI ปัจจุบัน: {selectedPatient.current_tki || '-'}</p>
              </div>

              <form onSubmit={handleSaveTKI} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TKI ใหม่ *
                  </label>
                  <select
                    value={tkiFormData.new_tki}
                    onChange={(e) =>
                      setTkiFormData({ ...tkiFormData, new_tki: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="imatinib">Imatinib</option>
                    <option value="nilotinib">Nilotinib</option>
                    <option value="dasatinib">Dasatinib</option>
                    <option value="ponatinib">Ponatinib</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เหตุผล *
                  </label>
                  <select
                    value={tkiFormData.reason}
                    onChange={(e) =>
                      setTkiFormData({ ...tkiFormData, reason: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="molecularFailure">Molecular Failure</option>
                    <option value="intolerance">Intolerance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่เริ่มยา *
                  </label>
                  <input
                    type="date"
                    value={tkiFormData.start_date}
                    onChange={(e) =>
                      setTkiFormData({ ...tkiFormData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ผลการตรวจ Mutation (ถ้ามี)
                  </label>
                  <textarea
                    value={tkiFormData.mutation_test_result}
                    onChange={(e) =>
                      setTkiFormData({ ...tkiFormData, mutation_test_result: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="เช่น T315I mutation detected"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={tkiFormData.notes}
                    onChange={(e) =>
                      setTkiFormData({ ...tkiFormData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowTKIModal(false)}
                    variant="outline"
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึก</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Mutation Test Modal */}
        {showMutationModal && selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">ลงข้อมูลการตรวจ Mutation</h2>
                <button
                  onClick={() => setShowMutationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-900">ผู้ป่วย: {selectedPatient.name}</p>
                <p className="text-xs text-orange-700">รหัส: {selectedPatient.patient_id}</p>
              </div>

              <form onSubmit={handleSaveMutation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    วันที่ตรวจ *
                  </label>
                  <input
                    type="date"
                    value={mutationFormData.test_date}
                    onChange={(e) =>
                      setMutationFormData({ ...mutationFormData, test_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ผลการตรวจ Mutation *
                  </label>
                  <textarea
                    value={mutationFormData.mutation_result}
                    onChange={(e) =>
                      setMutationFormData({ ...mutationFormData, mutation_result: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="เช่น T315I mutation detected, หรือ No mutation detected"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={mutationFormData.notes}
                    onChange={(e) =>
                      setMutationFormData({ ...mutationFormData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowMutationModal(false)}
                    variant="outline"
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">บันทึก</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <PatientDetailModal
            patient={selectedPatient}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedPatient(null);
            }}
          />
        )}

        {/* QR Code Modal */}
        {selectedPatient && (
          <PatientQRCode
            patientId={selectedPatient.patient_id}
            patientName={selectedPatient.name}
            isOpen={isQRModalOpen}
            onClose={() => {
              setIsQRModalOpen(false);
              setSelectedPatient(null);
            }}
          />
        )}
      </div>
    </DoctorLayout>
  );
}

