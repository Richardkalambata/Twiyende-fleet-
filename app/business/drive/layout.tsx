import { requireUser } from '@/lib/auth';
import { signOutAction } from '@/lib/actions';
import { ConductorNav } from '@/components/nav';
import { PhoneShell } from '@/components/shell';

export const viewport = { themeColor: '#111614' };

export default async function ConductorLayout({ children }: { children: React.ReactNode }) {
  await requireUser(['conductor']);
  return (
    <PhoneShell tone="dark" nav={<ConductorNav />}>
      <div className="flex items-center justify-end px-5 pt-[max(10px,env(safe-area-inset-top))]">
        <form action={signOutAction}>
          <button className="press h-9 rounded-full px-3 text-[13px] font-bold text-[#0B1B3B]">Log out</button>
        </form>
      </div>
      {children}
    </PhoneShell>
  );
}
