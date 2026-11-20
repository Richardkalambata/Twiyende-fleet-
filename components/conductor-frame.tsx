'use client';

import type { ReactNode } from 'react';
import { PhoneShell } from './shell';

export function ConductorFrame({ children, nav }: { children: ReactNode; nav: ReactNode }) {
  return (
    <PhoneShell tone="light" nav={nav}>
      {children}
    </PhoneShell>
  );
}
