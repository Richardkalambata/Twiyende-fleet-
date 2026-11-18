import { requireUser } from '@/lib/auth';
import { signOutAction } from '@/lib/actions';
import { ProfileForms } from '@/components/account-forms';
import { Avatar } from '@/components/shell';
import { formatPhone } from '@/lib/phone';
import { getConductorHome, operatorLabel } from '@/lib/service';
import { LogOut } from 'lucide-react';

export const metadata = { title: 'Conductor profile' };

export default async function ConductorProfilePage() {
  const user = await requireUser(['conductor']);
  const home = await getConductorHome(user.id);
  const operator = await operatorLabel(user.id);
  return (
    <div className="space-y-4 px-5 pb-6 pt-2">
      <div className="flex items-center gap-3">
        <Avatar initials={user.initials} size={64} />
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">{user.name}</h1>
          <p className="text-[14px] text-[#5C6578]">Conductor</p>
        </div>
      </div>
      <dl className="divide-y divide-[#E6EAF2] rounded-2xl bg-white px-4 shadow-[0_8px_24px_rgba(11,27,59,0.06)]">
        <Row label="Phone" value={formatPhone(user.phone)} />
        <Row label="Operator" value={operator} />
        <Row label="Today's bus" value={home.bus?.fleet_number ?? 'Unassigned'} />
        <Row label="Route" value={home.bus?.route ?? 'Ask your operator'} />
      </dl>
      <ProfileForms name={user.name} mode="pin" />
      <form action={signOutAction}>
        <button className="press flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 text-[15px] font-semibold shadow-[0_8px_24px_rgba(11,27,59,0.06)]">
          <LogOut className="h-5 w-5" />
          Log out
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-[15px]">
      <dt className="text-[#5C6578]">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
