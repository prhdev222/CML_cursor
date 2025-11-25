'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, Plus, Edit, Trash2, Building2, QrCode, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import PatientQRCode from '@/components/admin/PatientQRCode';

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
  hospital?: Hospital;
  next_appointment_date?: string;
  next_appointment_notes?: string;
  next_rq_pcr_date_range_start?: string;
  next_rq_pcr_date_range_end?: string;
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
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
    next_appointment_date: '',
    next_appointment_notes: '',
    next_rq_pcr_date_range_start: '',
    next_rq_pcr_date_range_end: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

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
            <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ป่วย</h1>
            <p className="text-gray-600 mt-2">เพิ่ม แก้ไข หรือลบข้อมูลผู้ป่วย</p>
          </div>
          <Button onClick={handleAdd} variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มผู้ป่วย
          </Button>
        </div>

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
                {patients.map((patient) => (
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
                ))}
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

