'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigError } from '@/lib/supabase-helpers';

interface TKIRecord {
  id: string;
  patient_id: string;
  tki_name: string;
  start_date: string;
  end_date: string | null;
  reason: string;
}

export default function TKIManagement() {
  const t = useTranslations();
  const [tkiRecords, setTkiRecords] = useState<TKIRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTKIRecords();
  }, []);

  const fetchTKIRecords = async () => {
    try {
      // Check if Supabase is configured before making the request
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'your_supabase_url_here') {
        setTkiRecords([]);
        setLoading(false);
        return;
      }
      
      const { data, error: supabaseError } = await supabase
        .from('tki_records')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(10);

      if (supabaseError) {
        // Silently fail if Supabase is not configured
        if (isSupabaseConfigError(supabaseError)) {
          setTkiRecords([]);
          setLoading(false);
          return;
        }
        // Only log non-config errors
        if (!isSupabaseConfigError(supabaseError)) {
          console.error('Error fetching TKI records:', supabaseError);
        }
        setTkiRecords([]);
        setLoading(false);
        return;
      }
      
      setTkiRecords(data || []);
    } catch (error: any) {
      // Only log if it's not a config error
      if (!isSupabaseConfigError(error)) {
        console.error('Error fetching TKI records:', error);
      }
      setTkiRecords([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {tkiRecords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No TKI records found.
        </div>
      ) : (
        <div className="space-y-3">
          {tkiRecords.map((record) => (
            <div
              key={record.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{record.tki_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Patient: {record.patient_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Started: {new Date(record.start_date).toLocaleDateString()}
                  </p>
                  {record.end_date && (
                    <p className="text-sm text-gray-600">
                      Ended: {new Date(record.end_date).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Reason: {record.reason === 'molecularFailure' ? 'Molecular Failure' : record.reason === 'intolerance' ? 'Intolerance' : record.reason}
                  </p>
                </div>
                {!record.end_date && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

