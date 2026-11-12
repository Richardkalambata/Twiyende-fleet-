import { requireUser } from '@/lib/auth';
import { signOutAction } from '@/lib/actions';
import { DemoSwitch } from '@/components/demo-switch';
import { Avatar, buttonClass } from '@/components/shell';
import { formatBalance, formatGrouped } from '@/lib/money';
import { formatPhone } from '@/lib/phone';
import { conductorTipBalance, getConductorHome, listDemoAccounts } from '@/lib/service';

export const metadata = { title: 'Conductor profile' };

export default async function ConductorProfilePage() {
  const user = await requireUser(['conductor']);
  const home = getConductorHome(user.id);
  return (
    <div className="space-y-4 px-4 py-5">
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
          <p className="text-2xl font-semibold text-[#1DB972]">{formatGrouped(home.todayNgwee)}</p>
          <p className="text-sm text-[#B7C2BA]">{home.todayRides} rides</p>
        </div>
        <div className="rounded-3xl bg-[#1A221E] p-4">
          <p className="text-xs text-[#8B978F]">Tips</p>
          <p className="text-2xl font-semibold">{formatBalance(conductorTipBalance(user.id))}</p>
          <p className="text-sm text-[#B7C2BA]">From passengers</p>
        </div>
      </section>
      <p className="text-sm text-[#8B978F]">Demo data. Fares belong to the owner. Tips stay with you.</p>
      <div className="text-[#14241C]">
        <DemoSwitch accounts={listDemoAccounts()} currentId={user.id} />
      </div>
      <form action={signOutAction}>
        <button className={buttonClass('outline')}>Sign out</button>
      </form>
    </div>
  );
}
