'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminLoggedIn } from '@/lib/auth';

export default function MonitoringPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.push('/th/admin/monitoring');
    } else {
      router.push('/th/admin/login');
    }
  }, [router]);

  return null;
}
