'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigError } from '@/lib/supabase-helpers';

interface Alert {
  id: string;
  patient_id: string;
  alert_type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  created_at: string;
}

export default function AlertPanel() {
  const t = useTranslations();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      // Check if Supabase is configured before making the request
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      if (!supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl === 'your_supabase_url_here') {
        setAlerts([]);
        setLoading(false);
        return;
      }
      
      const { data, error: supabaseError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (supabaseError) {
        // Silently fail if Supabase is not configured
        if (isSupabaseConfigError(supabaseError)) {
          setAlerts([]);
          setLoading(false);
          return;
        }
        // Only log non-config errors
        if (!isSupabaseConfigError(supabaseError)) {
          console.error('Error fetching alerts:', supabaseError);
        }
        setAlerts([]);
        setLoading(false);
        return;
      }
      
      setAlerts(data || []);
    } catch (error: any) {
      // Only log if it's not a config error
      if (!isSupabaseConfigError(error)) {
        console.error('Error fetching alerts:', error);
      }
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No alerts at this time.
        </div>
      ) : (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t(`alerts.${alert.alert_type}`)}
                </p>
                <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">Patient: {alert.patient_id}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

