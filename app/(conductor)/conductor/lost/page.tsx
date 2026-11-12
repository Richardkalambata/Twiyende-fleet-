import { requireUser } from '@/lib/auth';
import { ConductorLostBoard } from '@/components/conductor-lost';
import { getConductorLost } from '@/lib/service';

export const metadata = { title: 'Lost & found' };

export default async function ConductorLostPage() {
  const user = await requireUser(['conductor']);
  const data = getConductorLost(user.id);
  return <ConductorLostBoard fleetNumber={data.bus?.fleet_number ?? null} alerts={data.alerts} items={data.items} />;
}
