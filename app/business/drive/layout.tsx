import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { ConductorFrame } from '@/components/conductor-frame';
import { ShiftBar } from '@/components/tracking/shift-bar';
import { ConductorNav } from '@/components/nav';

export const viewport = { themeColor: '#071433' };

export default async function ConductorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(['conductor']);
  return (
    <ConductorFrame nav={<ConductorNav />}>
      {user.conductorClosesAt ? (
        <Link href="/business/drive/notifications" className="block bg-[#FFF6E8] px-5 py-3 text-sm font-semibold text-[#874900]">
          Account access ends {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lusaka' }).format(user.conductorClosesAt)} Zambia time. View notice.
        </Link>
      ) : <ShiftBar />}
      {children}
    </ConductorFrame>
  );
}
