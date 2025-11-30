'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { UserPlus, Edit, Trash2, UserCheck, X, Save, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface Doctor {
  id: string;
  doctor_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    doctor_code: '',
    name: '',
    password: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      const result = await response.json();

      if (!result.success) throw new Error(result.error);
      setDoctors(result.data || []);
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        doctor_code: doctor.doctor_code,
        name: doctor.name,
        password: '',
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        doctor_code: '',
        name: '',
        password: '',
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
    setFormData({
      doctor_code: '',
      name: '',
      password: '',
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.doctor_code || !formData.name) {
      setError('กรุณากรอกรหัส doctor และชื่อ');
      return;
    }

    if (!editingDoctor && !formData.password) {
      setError('กรุณากรอกรหัสผ่านสำหรับ doctor ใหม่');
      return;
    }

    try {
      if (editingDoctor) {
        // Update existing doctor
        const updateData: any = {
          doctor_code: formData.doctor_code,
          name: formData.name,
        };

        // Only update password if provided
        if (formData.password) {
          const response = await fetch('/api/doctor/hash-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: formData.password }),
          });
          const { hash } = await response.json();
          updateData.password_hash = hash;
        }

        const updateResponse = await fetch(`/api/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        const updateResult = await updateResponse.json();
        if (!updateResult.success) throw new Error(updateResult.error);
      } else {
        // Create new doctor
        const hashResponse = await fetch('/api/doctor/hash-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: formData.password }),
        });
        const hashResult = await hashResponse.json();
        const hash = hashResult.hash;

        const createResponse = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctor_code: formData.doctor_code,
            name: formData.name,
            password_hash: hash,
          }),
        });
        const createResult = await createResponse.json();
        if (!createResult.success) throw new Error(createResult.error);
      }

      handleCloseModal();
      fetchDoctors();
    } catch (err: any) {
      console.error('Error saving doctor:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ doctor นี้?')) return;

    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      fetchDoctors();
    } catch (err: any) {
      console.error('Error deleting doctor:', err);
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    }
  };

  const handleToggleActive = async (doctor: Doctor) => {
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !doctor.is_active }),
      });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      fetchDoctors();
    } catch (err: any) {
      console.error('Error toggling active status:', err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">กำลังโหลด...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">จัดการ Doctors</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            เพิ่ม Doctor ใหม่
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>รายการ Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ยังไม่มี doctor ในระบบ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">รหัส Doctor</th>
                      <th className="text-left p-3">ชื่อ</th>
                      <th className="text-left p-3">สถานะ</th>
                      <th className="text-left p-3">วันที่สร้าง</th>
                      <th className="text-right p-3">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <motion.tr
                        key={doctor.id}
                        className="border-b hover:bg-gray-50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="p-3 font-mono text-sm">{doctor.doctor_code}</td>
                        <td className="p-3">{doctor.name}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleActive(doctor)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              doctor.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {doctor.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                          </button>
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {new Date(doctor.created_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(doctor)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(doctor.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingDoctor ? 'แก้ไข Doctor' : 'เพิ่ม Doctor ใหม่'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัส Doctor *
                  </label>
                  <input
                    type="text"
                    value={formData.doctor_code}
                    onChange={(e) =>
                      setFormData({ ...formData, doctor_code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น DOC001"
                    required
                    disabled={!!editingDoctor}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ Doctor *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ชื่อ-นามสกุล"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่าน {!editingDoctor && '*'}
                    {editingDoctor && <span className="text-gray-500 text-xs">(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      placeholder={editingDoctor ? 'เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน' : 'รหัสผ่าน'}
                      required={!editingDoctor}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    บันทึก
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

