import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { VerifyPad } from '@/components/verify-pad';
import { getConductorHome } from '@/lib/service';

export const metadata = { title: 'Verify code' };

export default async function ConductorPage() {
  const user = await requireUser(['conductor']);
  const home = await getConductorHome(user.id);
  return (
    <>
      {home.bus && <Link className="block px-5 py-3 text-sm font-bold text-[#1747CB]" href={`/bus-sign/${home.bus.id}`}>Print or download bus sign</Link>}
      <VerifyPad
        fleetNumber={home.bus?.fleet_number ?? null}
        route={home.bus?.route}
        name={home.user.shortName}
        initialRides={home.todayRides}
        initialAmount={home.todayNgwee}
      />
    </>
  );
}
