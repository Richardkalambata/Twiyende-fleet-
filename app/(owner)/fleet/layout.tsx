import { requireUser } from '@/lib/auth';
import { OwnerFrame } from '@/components/owner-frame';
import { countOpenLost } from '@/lib/service';

export default async function FleetLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(['owner']);
  return <OwnerFrame openLost={await countOpenLost(user.id)}>{children}</OwnerFrame>;
}
