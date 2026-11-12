import { requireUser } from '@/lib/auth';
import { VerifyPad } from '@/components/verify-pad';
import { getConductorHome } from '@/lib/service';

export const metadata = { title: 'Verify code' };

export default async function ConductorPage() {
  const user = await requireUser(['conductor']);
  const home = getConductorHome(user.id);
  return <VerifyPad fleetNumber={home.bus?.fleet_number ?? null} initialRides={home.todayRides} initialAmount={home.todayNgwee} />;
}
