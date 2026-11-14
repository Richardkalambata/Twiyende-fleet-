import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { VerifyPad } from '@/components/verify-pad';
import { getConductorHome } from '@/lib/service';

export const metadata = { title: 'Verify code' };

export default async function ConductorPage() {
  const user = await requireUser(['conductor']);
  const home = await getConductorHome(user.id);
  if (!home.bus) {
    return (
      <div className="safe-top px-5 pb-16 text-center text-white">
        <h1 className="text-3xl font-semibold">No bus assigned</h1>
        <p className="mt-3 text-white/70">Contact your operator. You can verify codes once they put you on a bus for today.</p>
        <Link href="/business/drive/profile" className="mt-8 inline-flex h-12 items-center rounded-full bg-white/10 px-5 text-sm font-semibold">Profile</Link>
      </div>
    );
  }
  return <VerifyPad fleetNumber={home.bus.fleet_number} initialRides={home.todayRides} initialAmount={home.todayNgwee} />;
}
