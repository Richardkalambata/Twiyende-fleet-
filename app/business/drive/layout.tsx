import { requireUser } from '@/lib/auth';
import { ConductorFrame } from '@/components/conductor-frame';
import { ConductorNav } from '@/components/nav';

export const viewport = { themeColor: '#071433' };

export default async function ConductorLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['conductor']);
  return <ConductorFrame nav={<ConductorNav />}>{children}</ConductorFrame>;
}
