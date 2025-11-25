'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PatientEducation {
  id: string;
  category: string;
  title_th: string;
  content_th: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

const CATEGORIES = [
  { value: 'disease_info', label: 'ข้อมูลโรค' },
  { value: 'self_care', label: 'การดูแลตัวเอง' },
  { value: 'medication', label: 'การกินยา' },
];

export default function AdminPatientEducationPage() {
  const [educations, setEducations] = useState<PatientEducation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<PatientEducation | null>(null);
  const [formData, setFormData] = useState({
    category: 'disease_info',
    title_th: '',
    content_th: '',
    icon: '📚',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchEducations();
  }, []);

  const fetchEducations = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_education')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table patient_education does not exist. Please run the migration SQL.');
          alert('กรุณารัน migration SQL เพื่อสร้างตาราง patient_education ก่อน\n\nไฟล์: supabase/migrations/004_add_research_and_education.sql');
          setEducations([]);
          return;
        }
        throw error;
      }
      setEducations(data || []);
    } catch (error: any) {
      console.error('Error fetching patient education:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      alert(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error?.message || 'Unknown error'}`);
      setEducations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEducation(null);
    setFormData({
      category: 'disease_info',
      title_th: '',
      content_th: '',
      icon: '📚',
      is_active: true,
      sort_order: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (education: PatientEducation) => {
    setEditingEducation(education);
    setFormData({
      category: education.category,
      title_th: education.title_th,
      content_th: education.content_th,
      icon: education.icon,
      is_active: education.is_active,
      sort_order: education.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเนื้อหานี้?')) return;

    try {
      const { error } = await supabase.from('patient_education').delete().eq('id', id);
      if (error) throw error;
      fetchEducations();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEducation) {
        const { error } = await (supabase
          .from('patient_education') as any)
          .update(formData)
          .eq('id', editingEducation.id);
        
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
      } else {
        const { error } = await (supabase.from('patient_education') as any).insert([formData]);
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
      }
      
      setIsModalOpen(false);
      fetchEducations();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error?.message || error?.details || 'เกิดข้อผิดพลาด';
      alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const groupedEducations = educations.reduce((acc, edu) => {
    if (!acc[edu.category]) {
      acc[edu.category] = [];
    }
    acc[edu.category].push(edu);
    return acc;
  }, {} as Record<string, PatientEducation[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">เนื้อหาให้ความรู้ผู้ป่วย</h1>
            <p className="text-gray-600 mt-2">เพิ่ม แก้ไข หรือลบเนื้อหาให้ความรู้ผู้ป่วย</p>
          </div>
          <Button onClick={handleAdd} variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มเนื้อหา
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedEducations).map((category) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {getCategoryLabel(category)}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedEducations[category].map((education, index) => (
                    <motion.div
                      key={education.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card hover>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="text-3xl">{education.icon}</span>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{education.title_th}</h3>
                                <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                                  {education.content_th}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(education)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(education.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              education.is_active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {education.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedEducations).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                ยังไม่มีเนื้อหา
              </div>
            )}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingEducation ? 'แก้ไขเนื้อหา' : 'เพิ่มเนื้อหา'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หมวดหมู่ *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon (emoji)
                      </label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หัวข้อ *
                    </label>
                    <input
                      type="text"
                      value={formData.title_th}
                      onChange={(e) => setFormData({ ...formData, title_th: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เนื้อหา *
                    </label>
                    <textarea
                      value={formData.content_th}
                      onChange={(e) => setFormData({ ...formData, content_th: e.target.value })}
                      rows={10}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                    />
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
                      {editingEducation ? 'บันทึก' : 'เพิ่ม'}
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

