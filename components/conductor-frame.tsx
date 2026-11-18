'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PhoneShell } from './shell';

export function ConductorFrame({ children, nav }: { children: ReactNode; nav: ReactNode }) {
  const path = usePathname();
  const verify = path === '/business/drive';
  return (
    <PhoneShell tone={verify ? 'navy' : 'light'} nav={nav}>
      {children}
    </PhoneShell>
  );
}
