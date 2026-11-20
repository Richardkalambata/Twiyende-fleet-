import { requireUser } from '@/lib/auth';
import { OwnerFrame } from '@/components/owner-frame';
import { companyName, countOpenLost } from '@/lib/service';

export default async function FleetLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(['operator']);
  const [name, openLost] = await Promise.all([companyName(user.id), countOpenLost(user.id)]);
  return <OwnerFrame company={name} openLost={openLost} operator={{ name: user.name, initials: user.initials.length > 1 ? user.initials : user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() }}>{children}</OwnerFrame>;
}
