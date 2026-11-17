import { requireUser } from '@/lib/auth';
import { signOutAction } from '@/lib/actions';
import { ProfileForms } from '@/components/account-forms';
import { Avatar, buttonClass } from '@/components/shell';
import { formatBalance, formatGrouped } from '@/lib/money';
import { formatPhone } from '@/lib/phone';
import { conductorTipBalance, getConductorHome } from '@/lib/service';

export const metadata = { title: 'Conductor profile' };

export default async function ConductorProfilePage() {
  const user = await requireUser(['conductor']);
  const home = await getConductorHome(user.id);
  return (
    <div className="safe-top space-y-4 px-5 pb-6">
      <div className="flex items-center gap-3">
        <Avatar initials={user.initials} size={64} tone="copper" />
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-[#B7C2BA]">{formatPhone(user.phone)}</p>
          <p className="text-sm">Bus {home.bus?.fleet_number ?? 'unassigned'} · {home.bus?.route ?? 'Ask the owner to assign you'}</p>
        </div>
      </div>
      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-3xl bg-[#1A221E] p-4">
          <p className="text-xs text-[#8B978F]">Today</p>
          <p className="text-2xl font-semibold text-[#128A4E]">{formatGrouped(home.todayNgwee)}</p>
          <p className="text-sm text-[#B7C2BA]">{home.todayRides} rides</p>
        </div>
        <div className="rounded-3xl bg-[#1A221E] p-4">
          <p className="text-xs text-[#8B978F]">Tips</p>
          <p className="text-2xl font-semibold">{formatBalance(await conductorTipBalance(user.id))}</p>
          <p className="text-sm text-[#B7C2BA]">From passengers</p>
        </div>
      </section>
      <p className="text-[12px] text-[#8A93A6]">Payments simulated. Fares belong to the operator.</p>
      <div className="text-[#0B1B3B]"><ProfileForms name={user.name} /></div>
      <form action={signOutAction}>
        <button className={buttonClass('outline')}>Sign out</button>
      </form>
    </div>
  );
}
