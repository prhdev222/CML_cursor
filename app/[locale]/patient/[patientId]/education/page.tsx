'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isPatientLoggedIn } from '@/lib/patient-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PatientEducation {
  id: string;
  category: string;
  title_th: string;
  content_th: string;
  icon: string;
}

const CATEGORIES = [
  { value: 'disease_info', label: 'ข้อมูลโรคมะเร็งเม็ดเลือดขาวชนิดเรื้อรัง', icon: '🩸' },
  { value: 'self_care', label: 'การดูแลตัวเอง', icon: '💪' },
  { value: 'medication', label: 'การกินยาสม่ำเสมอ', icon: '💊' },
];

export default function PatientEducationPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [educations, setEducations] = useState<PatientEducation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!isPatientLoggedIn(patientId)) {
      window.location.href = `/patient/${patientId}/login`;
      return;
    }
    fetchEducations();
  }, [patientId]);

  const fetchEducations = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_education')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Table patient_education does not exist. Please run the migration SQL.');
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
      setEducations([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getCategoryIcon = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.icon || '📚';
  };

  const filteredEducations = selectedCategory
    ? educations.filter(e => e.category === selectedCategory)
    : educations;

  const groupedEducations = filteredEducations.reduce((acc, edu) => {
    if (!acc[edu.category]) {
      acc[edu.category] = [];
    }
    acc[edu.category].push(edu);
    return acc;
  }, {} as Record<string, PatientEducation[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/patient/${patientId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับหน้าหลัก
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">เนื้อหาให้ความรู้</h1>
          <p className="text-gray-600">ข้อมูลเกี่ยวกับโรคและการดูแลตัวเอง</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ทั้งหมด
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {Object.keys(groupedEducations).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">ยังไม่มีเนื้อหาในหมวดหมู่นี้</p>
              </CardContent>
            </Card>
          ) : (
            Object.keys(groupedEducations).map((category, categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-3xl">{getCategoryIcon(category)}</span>
                    {getCategoryLabel(category)}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedEducations[category].map((education, index) => (
                    <motion.div
                      key={education.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (categoryIndex * 0.1) + (index * 0.05) }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">{education.icon}</span>
                            <CardTitle className="text-xl">{education.title_th}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                              {education.content_th}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

