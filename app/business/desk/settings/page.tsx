import { requireUser } from '@/lib/auth';
import { resetDemoAction, signOutAction } from '@/lib/actions';
import { CompanyForm, ProfileForms } from '@/components/account-forms';
import { buttonClass } from '@/components/shell';
import { companyName } from '@/lib/service';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser(['operator']);
  return (
    <div className="space-y-4 px-4 py-5 text-[#0B1B3B] md:px-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Settings</h1>
      <CompanyForm name={await companyName(user.id)} />
      <ProfileForms name={user.name} />
      <p className="text-[12px] text-[#8A93A6]">Payments simulated. SMS is recorded and not sent.</p>
      {user.demo ? (
        <form action={resetDemoAction} className="rounded-2xl bg-white p-4">
          <h2 className="font-bold">Reset demo data</h2>
          <p className="mt-1 text-sm text-[#5C6578]">Restores the sample fleet for this demo operator.</p>
          <button className={`${buttonClass('outline')} mt-3`}>Reset demo data</button>
        </form>
      ) : null}
      <form action={signOutAction}><button className={buttonClass('outline')}>Log out</button></form>
    </div>
  );
}
