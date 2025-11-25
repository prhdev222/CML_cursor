'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Protocol {
  id: string;
  protocol_type: string;
  title_en: string;
  title_th: string;
  content_en: string;
  content_th: string;
  is_active: boolean;
}

const PROTOCOL_TYPES = [
  { value: 'tki_switch', label: 'การเปลี่ยนยา TKI' },
  { value: 'blood_test', label: 'การเจาะเลือด' },
  { value: 'bone_marrow_test', label: 'การเจาะกระดูก' },
];

export default function AdminProtocolsPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [formData, setFormData] = useState({
    protocol_type: 'tki_switch',
    title_en: '',
    title_th: '',
    content_en: '',
    content_th: '',
    is_active: true,
  });

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .order('protocol_type', { ascending: true });

      if (error) throw error;
      setProtocols(data || []);
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProtocol(null);
    setFormData({
      protocol_type: 'tki_switch',
      title_en: '',
      title_th: '',
      content_en: '',
      content_th: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setFormData({
      protocol_type: protocol.protocol_type,
      title_en: protocol.title_en,
      title_th: protocol.title_th,
      content_en: protocol.content_en,
      content_th: protocol.content_th,
      is_active: protocol.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Protocol นี้?')) return;

    try {
      const { error } = await supabase.from('protocols').delete().eq('id', id);
      if (error) throw error;
      fetchProtocols();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProtocol) {
        const { error } = await (supabase
          .from('protocols') as any)
          .update(formData)
          .eq('id', editingProtocol.id);
        
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('protocols') as any).insert([formData]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchProtocols();
    } catch (error) {
      alert('เกิดข้อผิดพลาด');
      console.error(error);
    }
  };

  const getProtocolTypeLabel = (type: string) => {
    return PROTOCOL_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการ Protocol</h1>
            <p className="text-gray-600 mt-2">แก้ไขเนื้อหา protocol การเปลี่ยนยาและการเจาะเลือด</p>
          </div>
          <Button onClick={handleAdd} variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            เพิ่ม Protocol
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {protocols.map((protocol, index) => (
              <motion.div
                key={protocol.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{protocol.title_th}</h3>
                            <p className="text-sm text-gray-600">{protocol.title_en}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          ประเภท: {getProtocolTypeLabel(protocol.protocol_type)}
                        </p>
                        <div className="mt-3 text-sm text-gray-700 line-clamp-2">
                          {protocol.content_th}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(protocol)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(protocol.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        protocol.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {protocol.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
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
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingProtocol ? 'แก้ไข Protocol' : 'เพิ่ม Protocol'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภท Protocol *
                    </label>
                    <select
                      value={formData.protocol_type}
                      onChange={(e) => setFormData({ ...formData, protocol_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      {PROTOCOL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        หัวข้อ (ไทย) *
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
                        หัวข้อ (English) *
                      </label>
                      <input
                        type="text"
                        value={formData.title_en}
                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เนื้อหา (ไทย) *
                    </label>
                    <textarea
                      value={formData.content_th}
                      onChange={(e) => setFormData({ ...formData, content_th: e.target.value })}
                      required
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เนื้อหา (English) *
                    </label>
                    <textarea
                      value={formData.content_en}
                      onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                      required
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      {editingProtocol ? 'บันทึก' : 'เพิ่ม'}
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

