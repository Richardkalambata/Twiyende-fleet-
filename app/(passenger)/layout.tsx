import { requireUser } from '@/lib/auth';
import { PassengerNav } from '@/components/nav';
import { PhoneShell } from '@/components/shell';

export default async function PassengerLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['passenger']);
  return (
    <PhoneShell nav={<PassengerNav />}>
      {children}
    </PhoneShell>
  );
}
