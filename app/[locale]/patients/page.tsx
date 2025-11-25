'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminLoggedIn } from '@/lib/auth';

export default function PatientsPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.push('/th/admin/patients');
    } else {
      router.push('/th/admin/login');
    }
  }, [router]);

  return null;
}
