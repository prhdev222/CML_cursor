'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isDoctorLoggedIn } from '@/lib/doctor-auth';

export default function DoctorPage() {
  const router = useRouter();

  useEffect(() => {
    if (isDoctorLoggedIn()) {
      router.push('/doctor/dashboard');
    } else {
      router.push('/doctor/login');
    }
  }, [router]);

  return null;
}

