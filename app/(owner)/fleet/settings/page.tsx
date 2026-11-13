import { requireUser } from '@/lib/auth';
import { resetDemoAction, signOutAction } from '@/lib/actions';
import { DemoSwitch } from '@/components/demo-switch';
import { buttonClass } from '@/components/shell';
import { formatPhone } from '@/lib/phone';
import { listDemoAccounts } from '@/lib/service';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser(['owner']);
  return (
    <div className="space-y-4 px-4 py-5 md:px-6">
      <h1 className="text-[28px] font-semibold">Settings</h1>
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">{user.name}</h2>
        <p className="text-sm text-[#5C6B63]">{formatPhone(user.phone)} · Owner</p>
        <p className="mt-3 text-sm text-[#5C6B63]">Twende is demo data for a Lusaka minibus pilot: Town–Matero, Town–Chilenje and nearby routes. Wallet top-ups and owner payouts go through a replaceable payment provider. The default provider only simulates MTN MoMo, Airtel Money and Zamtel Kwacha.</p>
      </section>
      <DemoSwitch accounts={await listDemoAccounts()} currentId={user.id} />
      <form action={resetDemoAction} className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Reset demo data</h2>
        <p className="mt-1 text-sm text-[#5C6B63]">Restores Richard’s K120 wallet, today’s sample fares, and the lost-and-found queue. This signs other demo sessions out.</p>
        <button className={`${buttonClass('copper')} mt-3`}>Reset demo data</button>
      </form>
      <form action={signOutAction}>
        <button className={buttonClass('outline')}>Log out</button>
      </form>
    </div>
  );
}
