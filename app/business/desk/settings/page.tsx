import { requireUser } from '@/lib/auth';
import { canResetDemoDatabase } from '@/lib/db';
import { resetDemoAction, signOutAction } from '@/lib/actions';
import { CompanyForm, ProfileForms } from '@/components/account-forms';
import { LogoutIcon } from '@/components/icons';
import { buttonClass } from '@/components/shell';
import { companyName } from '@/lib/service';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser(['operator']);
  return (
    <div className="space-y-4 px-4 py-5 text-[#0B1B3B] md:px-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Settings</h1>
      <section className="rounded-2xl bg-white p-4">
        <h2 className="font-bold">Account</h2>
        <p className="mt-1 text-sm text-[#5C6578]">Leave the operator desk on this phone.</p>
        <form action={signOutAction.bind(null, 'operator')} className="mt-3">
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1B3B] text-[15px] font-bold text-white">
            <LogoutIcon className="h-5 w-5" />
            Log out
          </button>
        </form>
      </section>
      <CompanyForm name={await companyName(user.id)} />
      <ProfileForms role="operator" name={user.name} />
      <p className="text-[12px] text-[#8A93A6]">Payments simulated. SMS is recorded and not sent.</p>
      {user.demo && canResetDemoDatabase() ? (
        <form action={resetDemoAction} className="rounded-2xl bg-white p-4">
          <h2 className="font-bold">Reset demo data</h2>
          <p className="mt-1 text-sm text-[#5C6578]">Restores the sample fleet for this demo operator.</p>
          <button className={`${buttonClass('outline')} mt-3`}>Reset demo data</button>
        </form>
      ) : null}
    </div>
  );
}
