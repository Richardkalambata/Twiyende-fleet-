'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useUnreadNotifications() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function update() {
      if (document.hidden) return;
      try {
        const response = await fetch('/api/notifications', { signal: controller.signal });
        if (response.status === 401) setUnread(0);
        if (response.ok) setUnread((await response.json()).unread);
      } catch {
        // Keep the last known total while offline.
      }
    }
    void update();
    const timer = window.setInterval(update, 30_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [path]);
  return unread;
}

export function NotificationBadge({ unread }: { unread: number }) {
  if (!unread) return null;
  return <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-[#1747CB] px-1 text-[10px] font-bold leading-4 text-white" aria-label={`${unread} unread notifications`}>{unread > 99 ? '99+' : unread}</span>;
}
