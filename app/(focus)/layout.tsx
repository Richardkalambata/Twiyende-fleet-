import { requireUser } from '@/lib/auth';
import { PhoneShell } from '@/components/shell';

export default async function FocusLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['passenger']);
  return <PhoneShell>{children}</PhoneShell>;
}
