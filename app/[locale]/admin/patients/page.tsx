'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, Plus, Edit, Trash2, Building2, QrCode, Key, Eye, Activity, Calculator, Info, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
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

export default function AdminPatientsPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState<'sokal' | 'hasford' | 'elts' | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filter === 'appointments') {
      // Filter patients with upcoming appointments (within next 7 days)
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const filtered = patients.filter(patient => {
        if (!patient.next_appointment_date) return false;
        const appointmentDate = new Date(patient.next_appointment_date);
        return appointmentDate >= today && appointmentDate <= nextWeek;
      });
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [filter, patients]);

  const fetchData = async () => {
    try {
      const [patientsRes, hospitalsRes] = await Promise.all([
        supabase
          .from('patients')
          .select(`
            *,
            hospital:hospitals(*)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('hospitals').select('*').order('name'),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (hospitalsRes.error) throw hospitalsRes.error;

      setPatients(patientsRes.data || []);
      setHospitals(hospitalsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPatient(null);
    setFormData({
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
    setIsModalOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
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
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ป่วยนี้?')) return;

    try {
      const { error } = await supabase.from('patients').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        baseline_rq_pcr_bcr_abl_positive: formData.baseline_rq_pcr_bcr_abl_positive === 'true' ? true : formData.baseline_rq_pcr_bcr_abl_positive === 'false' ? false : null,
        baseline_rq_pcr_bcr_abl_type: formData.baseline_rq_pcr_bcr_abl_type || null,
        baseline_rq_pcr_bcr_abl_other: formData.baseline_rq_pcr_bcr_abl_other || null,
        baseline_bm_chromosome: formData.baseline_bm_chromosome || null,
        baseline_bm_ph_percent: formData.baseline_bm_ph_percent
          ? parseFloat(formData.baseline_bm_ph_percent)
          : null,
        baseline_bm_blast_percent: formData.baseline_bm_blast_percent
          ? parseFloat(formData.baseline_bm_blast_percent)
          : null,
        baseline_cbc_hb: formData.baseline_cbc_hb ? parseFloat(formData.baseline_cbc_hb) : null,
        baseline_cbc_hct: formData.baseline_cbc_hct ? parseFloat(formData.baseline_cbc_hct) : null,
        baseline_cbc_wbc: formData.baseline_cbc_wbc ? parseFloat(formData.baseline_cbc_wbc) : null,
        baseline_cbc_neutrophil: formData.baseline_cbc_neutrophil ? parseFloat(formData.baseline_cbc_neutrophil) : null,
        baseline_cbc_lymphocyte: formData.baseline_cbc_lymphocyte ? parseFloat(formData.baseline_cbc_lymphocyte) : null,
        baseline_cbc_basophil: formData.baseline_cbc_basophil ? parseFloat(formData.baseline_cbc_basophil) : null,
        baseline_cbc_eosinophil: formData.baseline_cbc_eosinophil ? parseFloat(formData.baseline_cbc_eosinophil) : null,
        baseline_cbc_myelocyte: formData.baseline_cbc_myelocyte ? parseFloat(formData.baseline_cbc_myelocyte) : null,
        baseline_cbc_promyelocyte: formData.baseline_cbc_promyelocyte ? parseFloat(formData.baseline_cbc_promyelocyte) : null,
        baseline_cbc_metamyelocyte: formData.baseline_cbc_metamyelocyte ? parseFloat(formData.baseline_cbc_metamyelocyte) : null,
        baseline_cbc_band: formData.baseline_cbc_band ? parseFloat(formData.baseline_cbc_band) : null,
        baseline_cbc_blast: formData.baseline_cbc_blast ? parseFloat(formData.baseline_cbc_blast) : null,
        baseline_cbc_platelet: formData.baseline_cbc_platelet ? parseFloat(formData.baseline_cbc_platelet) : null,
        baseline_spleen_size: formData.baseline_spleen_size ? parseFloat(formData.baseline_spleen_size) : null,
        sokal_score: formData.sokal_score ? parseFloat(formData.sokal_score) : null,
        hasford_score: formData.hasford_score ? parseFloat(formData.hasford_score) : null,
        elts_score: formData.elts_score ? parseFloat(formData.elts_score) : null,
        hospital_id: formData.hospital_id || null,
        next_appointment_date: formData.next_appointment_date || null,
        next_appointment_notes: formData.next_appointment_notes || null,
        next_rq_pcr_date_range_start: formData.next_rq_pcr_date_range_start || null,
        next_rq_pcr_date_range_end: formData.next_rq_pcr_date_range_end || null,
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
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') {
        alert('รหัสผู้ป่วยนี้มีอยู่แล้ว');
      } else {
        alert('เกิดข้อผิดพลาด');
        console.error(error);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {filter === 'appointments' ? 'นัดหมายใกล้เคียง' : 'จัดการผู้ป่วย'}
            </h1>
            <p className="text-gray-600 mt-2">
              {filter === 'appointments' 
                ? 'รายชื่อผู้ป่วยที่มีนัดหมายภายใน 7 วันข้างหน้า' 
                : 'เพิ่ม แก้ไข หรือลบข้อมูลผู้ป่วย'}
            </p>
          </div>
          {filter !== 'appointments' && (
            <Button onClick={handleAdd} variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              เพิ่มผู้ป่วย
            </Button>
          )}
        </div>

        {filter === 'appointments' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3"
          >
            <Calendar className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-purple-800">
              แสดงผู้ป่วยที่มีนัดหมายระหว่าง {new Date().toLocaleDateString('th-TH')} - {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('th-TH')}
            </p>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัสผู้ป่วย</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อายุ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">โรงพยาบาล</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TKI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ระยะโรค</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      {filter === 'appointments' 
                        ? 'ไม่พบผู้ป่วยที่มีนัดหมายใกล้เคียง' 
                        : 'ไม่พบข้อมูลผู้ป่วย'}
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {patient.patient_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.hospital?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.current_tki || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.phase}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsQRModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="ดู QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsResetPasswordModalOpen(true);
                            setNewPassword('');
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="ปลดล็อกรหัสผ่าน"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(patient)}
                          className="text-blue-600 hover:text-blue-900"
                          title="แก้ไข"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="text-red-600 hover:text-red-900"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingPatient ? 'แก้ไขผู้ป่วย' : 'เพิ่มผู้ป่วย'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        รหัสผู้ป่วย *
                      </label>
                      <input
                        type="text"
                        value={formData.patient_id}
                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                        required
                        disabled={!!editingPatient}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อ *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เพศ *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                        value={formData.diagnosis_date}
                        onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                            value={formData.baseline_rq_pcr_bcr_abl_positive}
                            onChange={(e) =>
                              setFormData({ 
                                ...formData, 
                                baseline_rq_pcr_bcr_abl_positive: e.target.value,
                                baseline_rq_pcr_bcr_abl_type: e.target.value === 'true' ? formData.baseline_rq_pcr_bcr_abl_type : '',
                                baseline_rq_pcr_bcr_abl_other: e.target.value === 'true' ? formData.baseline_rq_pcr_bcr_abl_other : '',
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          >
                            <option value="">เลือก</option>
                            <option value="true">Positive</option>
                            <option value="false">Negative</option>
                          </select>
                        </div>
                        {formData.baseline_rq_pcr_bcr_abl_positive === 'true' && (
                          <>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">ประเภท</label>
                              <select
                                value={formData.baseline_rq_pcr_bcr_abl_type}
                                onChange={(e) =>
                                  setFormData({ 
                                    ...formData, 
                                    baseline_rq_pcr_bcr_abl_type: e.target.value,
                                    baseline_rq_pcr_bcr_abl_other: e.target.value !== 'other' ? '' : formData.baseline_rq_pcr_bcr_abl_other,
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                              >
                                <option value="">เลือก</option>
                                <option value="P190">P190</option>
                                <option value="P210">P210</option>
                                <option value="other">อื่นๆ</option>
                              </select>
                            </div>
                            {formData.baseline_rq_pcr_bcr_abl_type === 'other' && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">ระบุประเภท</label>
                                <input
                                  type="text"
                                  value={formData.baseline_rq_pcr_bcr_abl_other}
                                  onChange={(e) =>
                                    setFormData({ ...formData, baseline_rq_pcr_bcr_abl_other: e.target.value })
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                        value={formData.baseline_bm_chromosome}
                        onChange={(e) =>
                          setFormData({ ...formData, baseline_bm_chromosome: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                          value={formData.baseline_bm_ph_percent}
                          onChange={(e) =>
                            setFormData({ ...formData, baseline_bm_ph_percent: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                          value={formData.baseline_bm_blast_percent}
                          onChange={(e) =>
                            setFormData({ ...formData, baseline_bm_blast_percent: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                        value={formData.baseline_spleen_size}
                        onChange={(e) =>
                          setFormData({ ...formData, baseline_spleen_size: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                            value={formData.baseline_cbc_hb}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_hb: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 12.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Hct (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_hct}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_hct: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 38.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">WBC (x10⁹/L)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.baseline_cbc_wbc}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_wbc: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 50.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Neutrophil (N) (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_neutrophil}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_neutrophil: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 60.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Lymphocyte (L) (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_lymphocyte}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_lymphocyte: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 30.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Basophil (Ba) (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_basophil}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_basophil: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 3.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Eosinophil (Eo) (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_eosinophil}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_eosinophil: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 2.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Myelocyte (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_myelocyte}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_myelocyte: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 5.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Promyelocyte (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_promyelocyte}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_promyelocyte: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 2.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Metamyelocyte (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_metamyelocyte}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_metamyelocyte: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 3.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Band (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_band}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_band: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 4.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Blast (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.baseline_cbc_blast}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_blast: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                            placeholder="เช่น 2.0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Platelet (plt) (x10⁹/L)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.baseline_cbc_platelet}
                            onChange={(e) =>
                              setFormData({ ...formData, baseline_cbc_platelet: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
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
                        value={formData.baseline_other_sign_symptom}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            baseline_other_sign_symptom: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                          const age = parseInt(formData.age) || 0;
                          const spleenSize = parseFloat(formData.baseline_spleen_size) || 0;
                          const platelet = parseFloat(formData.baseline_cbc_platelet) || 450;
                          const blast = parseFloat(formData.baseline_cbc_blast) || 0;
                          const basophil = parseFloat(formData.baseline_cbc_basophil) || 0;
                          const eosinophil = parseFloat(formData.baseline_cbc_eosinophil) || 0;
                          
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
                          setFormData({
                            ...formData,
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
                            className="text-blue-600 hover:text-blue-800"
                            title="ดูรายละเอียด"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        {showScoreInfo === 'sokal' && (
                          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
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
                          value={formData.sokal_score}
                          onChange={(e) =>
                            setFormData({ ...formData, sokal_score: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                            className="text-blue-600 hover:text-blue-800"
                            title="ดูรายละเอียด"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        {showScoreInfo === 'hasford' && (
                          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
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
                          value={formData.hasford_score}
                          onChange={(e) =>
                            setFormData({ ...formData, hasford_score: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                            className="text-blue-600 hover:text-blue-800"
                            title="ดูรายละเอียด"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        {showScoreInfo === 'elts' && (
                          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
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
                          value={formData.elts_score}
                          onChange={(e) =>
                            setFormData({ ...formData, elts_score: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                      value={formData.hospital_id}
                      onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                        value={formData.current_tki}
                        onChange={(e) => setFormData({ ...formData, current_tki: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                        value={formData.phase}
                        onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                          value={formData.next_appointment_date}
                          onChange={(e) => setFormData({ ...formData, next_appointment_date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          วันที่เริ่มต้นช่วงเจาะ RQ-PCR
                        </label>
                        <input
                          type="date"
                          value={formData.next_rq_pcr_date_range_start}
                          onChange={(e) => setFormData({ ...formData, next_rq_pcr_date_range_start: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                          value={formData.next_rq_pcr_date_range_end}
                          onChange={(e) => setFormData({ ...formData, next_rq_pcr_date_range_end: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมายเหตุจากแพทย์สำหรับนัดครั้งหน้า
                      </label>
                      <textarea
                        value={formData.next_appointment_notes}
                        onChange={(e) => setFormData({ ...formData, next_appointment_notes: e.target.value })}
                        placeholder="เช่น: เจาะเลือด, BM, หัตถการอื่นๆ..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        หมายเหตุนี้จะแสดงให้ผู้ป่วยเห็น (เช่น: เจาะเลือด, BM, หัตถการอื่นๆ)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button type="submit" variant="primary">
                      {editingPatient ? 'บันทึก' : 'เพิ่ม'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
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

        {/* Reset Password Modal */}
        {selectedPatient && isResetPasswordModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>ปลดล็อกรหัสผ่านผู้ป่วย</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      ผู้ป่วย: <strong>{selectedPatient.name}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      รหัสผู้ป่วย: <strong>{selectedPatient.patient_id}</strong>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                      placeholder="กรอกรหัสผ่านใหม่"
                      minLength={6}
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ การปลดล็อกรหัสผ่านจะเปลี่ยนรหัสผ่านของผู้ป่วยเป็นรหัสผ่านใหม่ที่คุณตั้งไว้
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsResetPasswordModalOpen(false);
                        setSelectedPatient(null);
                        setNewPassword('');
                      }}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        if (!newPassword || newPassword.length < 6) {
                          alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
                          return;
                        }

                        setResetPasswordLoading(true);
                        try {
                          const response = await fetch('/api/patient/reset-password', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              patient_id: selectedPatient.patient_id,
                              new_password: newPassword,
                            }),
                          });

                          const data = await response.json();

                          if (!response.ok || !data.success) {
                            throw new Error(data.error || 'Failed to reset password');
                          }

                          alert('ปลดล็อกรหัสผ่านสำเร็จ!');
                          setIsResetPasswordModalOpen(false);
                          setSelectedPatient(null);
                          setNewPassword('');
                        } catch (error: any) {
                          alert(error.message || 'เกิดข้อผิดพลาด');
                        } finally {
                          setResetPasswordLoading(false);
                        }
                      }}
                      disabled={resetPasswordLoading}
                    >
                      {resetPasswordLoading ? 'กำลังดำเนินการ...' : 'ปลดล็อกรหัสผ่าน'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

