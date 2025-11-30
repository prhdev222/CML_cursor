'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Pill, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { clearTKICache, TKIMedication } from '@/lib/tki-medications';

export default function AdminMedicationsPage() {
  const [medications, setMedications] = useState<TKIMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<TKIMedication | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    medication_key: '',
    name_th: '',
    name_en: '',
    side_effects: [''],
    monitoring: [''],
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await fetch('/api/tki-medications');
      const result = await response.json();

      if (!result.success) {
        console.error('Error fetching medications:', result.error);
        if (result.error?.includes('does not exist') || result.error?.includes('42P01')) {
          alert('กรุณารัน migration SQL เพื่อสร้างตาราง tki_medications ก่อน\n\nไฟล์: supabase/migrations/007_add_tki_management.sql');
        }
        setMedications([]);
        return;
      }
      setMedications(result.data || []);
    } catch (error: any) {
      console.error('Error fetching medications:', error);
      alert(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error?.message || 'Unknown error'}`);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMedication(null);
    setEditingKey(null);
    setFormData({
      medication_key: '',
      name_th: '',
      name_en: '',
      side_effects: [''],
      monitoring: [''],
      is_active: true,
      sort_order: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (medication: TKIMedication) => {
    setEditingMedication(medication);
    setEditingKey(null);
    setFormData({
      medication_key: medication.medication_key,
      name_th: medication.name_th,
      name_en: medication.name_en,
      side_effects: medication.side_effects.length > 0 ? medication.side_effects : [''],
      monitoring: medication.monitoring.length > 0 ? medication.monitoring : [''],
      is_active: medication.is_active,
      sort_order: medication.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleQuickEdit = (medication: TKIMedication) => {
    setEditingKey(medication.id);
    setFormData({
      medication_key: medication.medication_key,
      name_th: medication.name_th,
      name_en: medication.name_en,
      side_effects: medication.side_effects.length > 0 ? medication.side_effects : [''],
      monitoring: medication.monitoring.length > 0 ? medication.monitoring : [''],
      is_active: medication.is_active,
      sort_order: medication.sort_order,
    });
  };

  const handleQuickSave = async (id: string) => {
    try {
      const { error } = await (supabase
        .from('tki_medications') as any)
        .update({
          name_th: formData.name_th,
          name_en: formData.name_en,
          side_effects: formData.side_effects.filter(s => s.trim() !== ''),
          monitoring: formData.monitoring.filter(m => m.trim() !== ''),
          is_active: formData.is_active,
          sort_order: formData.sort_order,
        })
        .eq('id', id);

      if (error) throw error;

      clearTKICache();
      setEditingKey(null);
      fetchMedications();
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาดในการบันทึก: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบยานี้?')) return;

    try {
      const response = await fetch(`/api/tki-medications/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error);
      clearTKICache();
      fetchMedications();
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการลบ');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMedication) {
        const response = await fetch(`/api/tki-medications/${editingMedication.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name_th: formData.name_th,
            name_en: formData.name_en,
            side_effects: formData.side_effects.filter(s => s.trim() !== ''),
            monitoring: formData.monitoring.filter(m => m.trim() !== ''),
            is_active: formData.is_active,
            sort_order: formData.sort_order,
          }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
      } else {
        // Check if medication_key exists
        const checkResponse = await fetch('/api/tki-medications');
        const checkResult = await checkResponse.json();
        
        if (checkResult.success && checkResult.data) {
          const existing = checkResult.data.find((m: any) => m.medication_key === formData.medication_key);
          if (existing) {
            alert('medication_key นี้มีอยู่แล้ว กรุณาใช้ key อื่น');
            return;
          }
        }

        const response = await fetch('/api/tki-medications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medication_key: formData.medication_key,
            name_th: formData.name_th,
            name_en: formData.name_en,
            side_effects: formData.side_effects.filter(s => s.trim() !== ''),
            monitoring: formData.monitoring.filter(s => s.trim() !== ''),
            is_active: formData.is_active,
            sort_order: formData.sort_order,
          }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
      }

      clearTKICache();
      setIsModalOpen(false);
      fetchMedications();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      alert(`เกิดข้อผิดพลาด: ${error?.message || 'Unknown error'}`);
    }
  };

  const addSideEffect = () => {
    setFormData({ ...formData, side_effects: [...formData.side_effects, ''] });
  };

  const removeSideEffect = (index: number) => {
    setFormData({
      ...formData,
      side_effects: formData.side_effects.filter((_, i) => i !== index),
    });
  };

  const updateSideEffect = (index: number, value: string) => {
    const newSideEffects = [...formData.side_effects];
    newSideEffects[index] = value;
    setFormData({ ...formData, side_effects: newSideEffects });
  };

  const addMonitoring = () => {
    setFormData({ ...formData, monitoring: [...formData.monitoring, ''] });
  };

  const removeMonitoring = (index: number) => {
    setFormData({
      ...formData,
      monitoring: formData.monitoring.filter((_, i) => i !== index),
    });
  };

  const updateMonitoring = (index: number, value: string) => {
    const newMonitoring = [...formData.monitoring];
    newMonitoring[index] = value;
    setFormData({ ...formData, monitoring: newMonitoring });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการยา TKI</h1>
            <p className="text-gray-600 mt-2">เพิ่ม แก้ไข หรือลบข้อมูลยา TKI</p>
          </div>
          <Button onClick={handleAdd} variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มยาใหม่
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((medication, index) => (
              <motion.div
                key={medication.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <CardContent className="p-6">
                    {editingKey === medication.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อยาภาษาไทย *
                          </label>
                          <input
                            type="text"
                            value={formData.name_th}
                            onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อยาภาษาอังกฤษ *
                          </label>
                          <input
                            type="text"
                            value={formData.name_en}
                            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.is_active}
                              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">ใช้งาน</span>
                          </label>
                          <div className="flex-1" />
                          <Button
                            variant="outline"
                            onClick={() => setEditingKey(null)}
                            className="mr-2"
                          >
                            <X className="w-4 h-4 mr-1" />
                            ยกเลิก
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleQuickSave(medication.id)}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            บันทึก
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Pill className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-gray-900">{medication.name_en}</h3>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  medication.is_active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {medication.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{medication.name_th}</p>
                            <p className="text-xs text-gray-500 mt-1">Key: {medication.medication_key}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleQuickEdit(medication)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="แก้ไขด่วน"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(medication)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="แก้ไขเต็มรูปแบบ"
                            >
                              <Pill className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(medication.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">ผลข้างเคียง:</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {medication.side_effects.map((effect, idx) => (
                                <li key={idx}>• {effect}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">การติดตามผล:</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {medication.monitoring.map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {medications.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-500">
                ยังไม่มีข้อมูลยา
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingMedication ? 'แก้ไขยา' : 'เพิ่มยาใหม่'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medication Key * (ต้องไม่ซ้ำ)
                      </label>
                      <input
                        type="text"
                        value={formData.medication_key}
                        onChange={(e) => setFormData({ ...formData, medication_key: e.target.value })}
                        required
                        disabled={!!editingMedication}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100"
                        placeholder="new_medication"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ลำดับ
                      </label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อยาภาษาไทย *
                    </label>
                    <input
                      type="text"
                      value={formData.name_th}
                      onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อยาภาษาอังกฤษ *
                    </label>
                    <input
                      type="text"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        ผลข้างเคียงที่ต้องเฝ้าระวัง *
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addSideEffect}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        เพิ่ม
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.side_effects.map((effect, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={effect}
                            onChange={(e) => updateSideEffect(index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="ผลข้างเคียง"
                          />
                          {formData.side_effects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSideEffect(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        การติดตามผล *
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addMonitoring}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        เพิ่ม
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {formData.monitoring.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateMonitoring(index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="การติดตามผล"
                          />
                          {formData.monitoring.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMonitoring(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">ใช้งาน</span>
                    </label>
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
                      {editingMedication ? 'บันทึก' : 'เพิ่ม'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


