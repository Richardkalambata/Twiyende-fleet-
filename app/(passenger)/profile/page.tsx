import { requireUser } from '@/lib/auth';
import { ProfileMenu } from '@/components/profile-menu';
import { Avatar } from '@/components/shell';
import { formatPhone } from '@/lib/phone';
import { listNotifications } from '@/lib/service';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await requireUser(['passenger']);
  const notices = await listNotifications(user.id);
  const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lusaka', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return (
    <div className="safe-top space-y-4 px-5 pb-8">
      <div className="flex items-center gap-3">
        <Avatar initials={user.initials} size={64} />
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">{user.name}</h1>
          <p className="text-[14px] text-[#5C6578]">Passenger</p>
        </div>
      </div>
      <dl className="divide-y divide-[#E6EAF2] rounded-2xl bg-white px-4 shadow-[0_8px_24px_rgba(11,27,59,0.06)]">
        <div className="flex items-center justify-between py-3 text-[15px]">
          <dt className="text-[#5C6578]">Full name</dt>
          <dd className="font-semibold">{user.name}</dd>
        </div>
        <div className="flex items-center justify-between py-3 text-[15px]">
          <dt className="text-[#5C6578]">Phone number</dt>
          <dd className="num font-semibold">{formatPhone(user.phone)}</dd>
        </div>
      </dl>
      <ProfileMenu name={user.name} notices={notices} />
      <p className="text-center text-[12px] text-[#8A93A6]">{today}</p>
    </div>
  );
}
