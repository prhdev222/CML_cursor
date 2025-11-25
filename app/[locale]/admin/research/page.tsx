'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResearchPaper {
  id: string;
  title_th: string;
  authors_th?: string;
  journal_th?: string;
  year?: number;
  description_th?: string;
  url?: string;
  is_active: boolean;
  sort_order: number;
}

export default function AdminResearchPage() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ResearchPaper | null>(null);
  const [formData, setFormData] = useState({
    title_th: '',
    authors_th: '',
    journal_th: '',
    year: new Date().getFullYear(),
    description_th: '',
    url: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data, error } = await supabase
        .from('research_papers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table research_papers does not exist. Please run the migration SQL.');
          alert('กรุณารัน migration SQL เพื่อสร้างตาราง research_papers ก่อน\n\nไฟล์: supabase/migrations/004_add_research_and_education.sql');
          setPapers([]);
          return;
        }
        throw error;
      }
      setPapers(data || []);
    } catch (error: any) {
      console.error('Error fetching research papers:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      alert(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error?.message || 'Unknown error'}`);
      setPapers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPaper(null);
    setFormData({
      title_th: '',
      authors_th: '',
      journal_th: '',
      year: new Date().getFullYear(),
      description_th: '',
      url: '',
      is_active: true,
      sort_order: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (paper: ResearchPaper) => {
    setEditingPaper(paper);
    setFormData({
      title_th: paper.title_th,
      authors_th: paper.authors_th || '',
      journal_th: paper.journal_th || '',
      year: paper.year || new Date().getFullYear(),
      description_th: paper.description_th || '',
      url: paper.url || '',
      is_active: paper.is_active,
      sort_order: paper.sort_order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบงานวิจัยนี้?')) return;

    try {
      const { error } = await supabase.from('research_papers').delete().eq('id', id);
      if (error) throw error;
      fetchPapers();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPaper) {
        const { error } = await (supabase
          .from('research_papers') as any)
          .update(formData)
          .eq('id', editingPaper.id);
        
        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
      } else {
        const { error } = await (supabase.from('research_papers') as any).insert([formData]);
        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }
      }
      
      setIsModalOpen(false);
      fetchPapers();
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
            <h1 className="text-3xl font-bold text-gray-900">จัดการงานวิจัย</h1>
            <p className="text-gray-600 mt-2">เพิ่ม แก้ไข หรือลบงานวิจัย</p>
          </div>
          <Button onClick={handleAdd} variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            เพิ่มงานวิจัย
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">กำลังโหลด...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {papers.map((paper, index) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{paper.title_th}</h3>
                        {paper.authors_th && (
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">ผู้เขียน:</span> {paper.authors_th}
                          </p>
                        )}
                        {paper.journal_th && (
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">วารสาร:</span> {paper.journal_th}
                            {paper.year && ` (${paper.year})`}
                          </p>
                        )}
                        {paper.description_th && (
                          <p className="text-sm text-gray-700 mt-2">{paper.description_th}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(paper)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(paper.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {paper.url && (
                      <a
                        href={paper.url}
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
                        paper.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {paper.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
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
                <CardTitle>{editingPaper ? 'แก้ไขงานวิจัย' : 'เพิ่มงานวิจัย'}</CardTitle>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ผู้เขียน
                      </label>
                      <input
                        type="text"
                        value={formData.authors_th}
                        onChange={(e) => setFormData({ ...formData, authors_th: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วารสาร
                      </label>
                      <input
                        type="text"
                        value={formData.journal_th}
                        onChange={(e) => setFormData({ ...formData, journal_th: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ปีที่พิมพ์
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
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
                      {editingPaper ? 'บันทึก' : 'เพิ่ม'}
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

