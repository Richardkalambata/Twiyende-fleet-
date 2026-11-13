import { requireUser } from '@/lib/auth';
import { ConductorNav } from '@/components/nav';
import { PhoneShell } from '@/components/shell';

export const viewport = { themeColor: '#111614' };

export default async function ConductorLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['conductor']);
  return (
    <PhoneShell tone="dark" nav={<ConductorNav />}>
      {children}
    </PhoneShell>
  );
}
