'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminLoggedIn } from '@/lib/auth';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.push('/admin/dashboard');
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  return null;
}



