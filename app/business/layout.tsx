import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'Twende Fleet', template: '%s · Twende Fleet' },
  applicationName: 'Twende Fleet',
  manifest: '/business/fleet.webmanifest',
};

export default function FleetLayout({ children }: { children: ReactNode }) {
  return children;
}
