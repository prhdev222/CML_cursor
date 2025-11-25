'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigError } from '@/lib/supabase-helpers';

interface Patient {
  id: string;
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis_date: string;
  current_tki: string;
  phase: string;
  created_at: string;
}

export default function PatientList() {
  const t = useTranslations();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setError(null);
      
      // Check if Supabase is configured before making the request
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'your_supabase_url_here') {
        setError('supabase_not_configured');
        setLoading(false);
        return;
      }
      
      const { data, error: supabaseError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        // Check if it's a placeholder/connection error
        if (isSupabaseConfigError(supabaseError)) {
          setError('supabase_not_configured');
          setLoading(false);
          return;
        } else {
          // Only log non-config errors
          console.error('Error fetching patients:', supabaseError);
          setError('fetch_error');
          setLoading(false);
          return;
        }
      }
      
      setPatients(data || []);
    } catch (err: any) {
      // Check if it's a config error first
      if (isSupabaseConfigError(err)) {
        setError('supabase_not_configured');
      } else {
        // Only log if it's not a config error
        console.error('Error fetching patients:', err);
        setError('fetch_error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error === 'supabase_not_configured') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Supabase ไม่ได้ตั้งค่า
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>เพื่อใช้งานระบบจัดการผู้ป่วย กรุณาตั้งค่า Supabase:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>สร้าง Supabase project ที่ <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>รัน SQL script จาก <code className="bg-yellow-100 px-1 rounded">supabase/schema.sql</code></li>
                <li>อัปเดตไฟล์ <code className="bg-yellow-100 px-1 rounded">.env.local</code> ด้วย Supabase URL และ Anon Key</li>
                <li>รีสตาร์ท development server</li>
              </ol>
              <p className="mt-3 text-xs">
                ดูรายละเอียดเพิ่มเติมใน <code className="bg-yellow-100 px-1 rounded">README.md</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'fetch_error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              เกิดข้อผิดพลาดในการโหลดข้อมูล
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>ไม่สามารถโหลดข้อมูลผู้ป่วยได้ กรุณาลองใหม่อีกครั้ง</p>
              <button
                onClick={fetchPatients}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('patient.patientId')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('patient.name')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('patient.age')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('patient.currentTKI')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('patient.phase')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {patients.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                No patients found. Add your first patient to get started.
              </td>
            </tr>
          ) : (
            patients.map((patient) => (
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
                  {patient.current_tki || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.phase || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4">
                    {t('common.edit')}
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

