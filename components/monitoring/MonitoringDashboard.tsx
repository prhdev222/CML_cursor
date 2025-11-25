'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigError } from '@/lib/supabase-helpers';

interface TestResult {
  id: string;
  patient_id: string;
  test_type: string;
  bcr_abl_is: number | null;
  test_date: string;
  next_test_date: string;
  status: string;
}

export default function MonitoringDashboard() {
  const t = useTranslations();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestResults();
  }, []);

  const fetchTestResults = async () => {
    try {
      // Check if Supabase is configured before making the request
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'your_supabase_url_here') {
        setTestResults([]);
        setLoading(false);
        return;
      }
      
      const { data, error: supabaseError } = await supabase
        .from('test_results')
        .select('*')
        .order('test_date', { ascending: false })
        .limit(10);

      if (supabaseError) {
        // Silently fail if Supabase is not configured
        if (isSupabaseConfigError(supabaseError)) {
          setTestResults([]);
          setLoading(false);
          return;
        }
        // Only log non-config errors
        if (!isSupabaseConfigError(supabaseError)) {
          console.error('Error fetching test results:', supabaseError);
        }
        setTestResults([]);
        setLoading(false);
        return;
      }
      
      setTestResults(data || []);
    } catch (error: any) {
      // Only log if it's not a config error
      if (!isSupabaseConfigError(error)) {
        console.error('Error fetching test results:', error);
      }
      setTestResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'failure':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {testResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No test results found. Add test results to start monitoring.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('monitoring.bcrAbl')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('monitoring.lastTest')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('monitoring.nextTest')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('monitoring.status')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {result.bcr_abl_is !== null ? `${result.bcr_abl_is}%` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {format(new Date(result.test_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {result.next_test_date
                      ? format(new Date(result.next_test_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        result.status
                      )}`}
                    >
                      {t(`monitoring.${result.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

