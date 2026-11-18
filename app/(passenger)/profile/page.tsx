import { requireUser } from '@/lib/auth';
import { signOutAction } from '@/lib/actions';
import { ProfileForms } from '@/components/account-forms';
import { LogoutIcon } from '@/components/icons';
import { Avatar, buttonClass } from '@/components/shell';
import { formatBalance, formatCompact } from '@/lib/money';
import { formatPhone } from '@/lib/phone';
import { formatRideWhen } from '@/lib/time';
import { getPassengerHome, listWalletActivity } from '@/lib/service';
import Link from 'next/link';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await requireUser(['passenger']);
  const home = await getPassengerHome(user.id);
  const activity = await listWalletActivity(user.id);
  return (
    <div className="safe-top space-y-4 px-5 pb-6">
      <div className="flex items-center gap-3">
        <Avatar initials={user.initials} size={64} />
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.02em]">{user.name}</h1>
          <p className="text-sm text-[#5C6B63]">{formatPhone(user.phone)} · Passenger</p>
        </div>
      </div>
      <form action={signOutAction}>
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1B3B] text-[15px] font-bold text-white">
          <LogoutIcon className="h-5 w-5" />
          Log out
        </button>
      </form>
      <section className="rounded-3xl bg-[#1F5BFF] p-5 text-white">
        <p className="text-sm text-white/75">Wallet</p>
        <p className="text-4xl font-semibold">{formatBalance(home.balanceNgwee)}</p>
        <Link href="/topup" className={`${buttonClass('copper')} mt-4`}>Top up</Link>
      </section>
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Wallet activity</h2>
        <ul className="mt-2 divide-y divide-[#F0EBE3]">
          {activity.map((item) => (
            <li key={item.id} className="flex items-center justify-between py-3 text-sm">
              <span>
                <span className="block font-medium capitalize">{item.type}</span>
                <span className="text-[#6A756E]">{item.note} · {formatRideWhen(item.createdAt)}</span>
              </span>
              <span className={item.amountNgwee < 0 ? 'text-[#9A3B1A]' : 'text-[#1F5BFF]'}>{formatCompact(item.amountNgwee)}</span>
            </li>
          ))}
        </ul>
      </section>
      <ProfileForms name={user.name} />
      <p className="text-[12px] text-[#8A93A6]">Payments simulated. No mobile-money charge is sent.</p>
    </div>
  );
}
