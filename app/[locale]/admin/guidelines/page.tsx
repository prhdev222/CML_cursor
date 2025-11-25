'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BookOpen, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface Guideline {
  id: string;
  title_th: string;
  description_th?: string;
  url?: string;
  icon: string;
  organization?: string;
  is_active: boolean;
  sort_order: number;
}

export default function AdminGuidelinesPage() {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<Guideline | null>(null);
  const [formData, setFormData] = useState({
    title_th: '',
    description_th: '',
    url: '',
    icon: '📋',
    organization: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from('guidelines')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setGuidelines(data || []);
    } catch (error) {
      console.error('Error fetching guidelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingGuideline(null);
    setFormData({
      title_th: '',
      description_th: '',
      url: '',
      icon: '📋',
      organization: '',
      is_active: true,
      sort_order: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (guideline: Guideline) => {
    setEditingGuideline(guideline);
    setFormData({
      title_th: guideline.title_th,
      description_th: guideline.description_th || '',
      url: guideline.url || '',
      icon: guideline.icon,
      organization: guideline.organization || '',
      is_active: guideline.is_active,
      sort_order: guideline.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแนวทางนี้?')) return;

    try {
      const { error } = await supabase.from('guidelines').delete().eq('id', id);
      if (error) throw error;
      fetchGuidelines();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingGuideline) {
        const { error } = await (supabase
          .from('guidelines') as any)
          .update(formData)
          .eq('id', editingGuideline.id);
        
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
      } else {
        const { error } = await (supabase.from('guidelines') as any).insert([formData]);
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
      }
      
      setIsModalOpen(false);
      fetchGuidelines();
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error?.message || error?.details || 'เกิดข้อผิดพลาด';
      alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการแนวทางปฏิบัติ</h1>
            <p className="text-gray-600 mt-2">เพิ่ม แก้ไข หรือลบแนวทางปฏิบัติ</p>
          </div>
          <Button onClick={handleAdd} variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มแนวทาง
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guidelines.map((guideline, index) => (
              <motion.div
                key={guideline.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-3xl">{guideline.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{guideline.title_th}</h3>
                          {guideline.organization && (
                            <p className="text-xs text-gray-500 mt-1">{guideline.organization}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(guideline)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(guideline.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {guideline.url && (
                      <a
                        href={guideline.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        เปิดลิงก์
                      </a>
                    )}
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        guideline.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {guideline.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingGuideline ? 'แก้ไขแนวทาง' : 'เพิ่มแนวทาง'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อเรื่อง *
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
                      คำอธิบาย
                    </label>
                    <textarea
                      value={formData.description_th}
                      onChange={(e) => setFormData({ ...formData, description_th: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL
                      </label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                      />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        องค์กร
                      </label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
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
                      {editingGuideline ? 'บันทึก' : 'เพิ่ม'}
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

