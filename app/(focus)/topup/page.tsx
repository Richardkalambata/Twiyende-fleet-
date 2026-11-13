import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { TopUpForm } from '@/components/topup-form';
import { BackIcon } from '@/components/icons';
import { getPassengerHome } from '@/lib/service';

export const metadata = { title: 'Top up' };

export default async function TopUpPage() {
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 px-2">
        <Link href="/home" className="grid h-14 w-14 place-items-center" aria-label="Back"><BackIcon /></Link>
        <h1 className="text-xl font-semibold">Top up</h1>
      </div>
      <TopUpForm phone={user.phone} balanceNgwee={home.balanceNgwee} />
    </div>
  );
}
