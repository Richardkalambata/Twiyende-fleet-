'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ConductorRefresh() {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) router.refresh();
    }, 30_000);
    const refreshOnReturn = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [router]);
  return null;
}
