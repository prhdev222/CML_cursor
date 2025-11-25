'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import AdminLayout from '@/components/admin/AdminLayout';
import TKIManagement from '@/components/tki/TKIManagement';
import TKISwitchForm from '@/components/tki/TKISwitchForm';

export default function AdminTKIPage() {
  const t = useTranslations();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('tki.title')}
          </h1>
          <p className="text-gray-600 mt-2">จัดการ TKI และการเปลี่ยนยา</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('tki.currentTKI')}</CardTitle>
            </CardHeader>
            <CardContent>
              <TKIManagement />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('tki.switchTKI')}</CardTitle>
            </CardHeader>
            <CardContent>
              <TKISwitchForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}



