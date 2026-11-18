'use client';

import { useEffect, useState } from 'react';

type Toast = { id: number; message: string; tone: 'error' | 'ok' };

export function toast(message: string, tone: 'error' | 'ok' = 'error') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('twende-toast', { detail: { message, tone } }));
}

export function Toaster() {
  const [item, setItem] = useState<Toast | null>(null);

  useEffect(() => {
    let timer = 0;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; tone: 'error' | 'ok' }>).detail;
      setItem({ id: Date.now(), message: detail.message, tone: detail.tone });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setItem(null), 4200);
    };
    window.addEventListener('twende-toast', onToast);
    return () => {
      window.removeEventListener('twende-toast', onToast);
      window.clearTimeout(timer);
    };
  }, []);

  if (!item) return null;
  const error = item.tone === 'error';
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4" role="status">
      <p className={`rise pointer-events-auto glass max-w-sm rounded-full px-4 py-3 text-sm font-semibold ${error ? 'text-[#FFD7BF]' : 'text-white'}`}>
        {item.message}
      </p>
    </div>
  );
}
