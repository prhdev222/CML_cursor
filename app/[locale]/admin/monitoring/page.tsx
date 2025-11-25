'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/admin/AdminLayout';
import MonitoringDashboard from '@/components/monitoring/MonitoringDashboard';
import AlertPanel from '@/components/monitoring/AlertPanel';

export default function AdminMonitoringPage() {
  const t = useTranslations();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('monitoring.title')}
          </h1>
          <p className="text-gray-600 mt-2">ติดตามผลการตรวจและแจ้งเตือน</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('monitoring.testResults')}</CardTitle>
              </CardHeader>
              <CardContent>
                <MonitoringDashboard />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>การแจ้งเตือน</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertPanel />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

