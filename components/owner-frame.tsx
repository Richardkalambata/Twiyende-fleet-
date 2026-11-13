'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Map } from 'lucide-react';
import { signOutAction } from '@/lib/actions';
import { BusIcon, ChartIcon, GearIcon, LogoutIcon, LostIcon, UsersIcon, WalletIcon } from './icons';

const LINKS = [
  { href: '/business/desk', label: 'Overview', icon: ChartIcon },
  { href: '/business/desk/buses', label: 'Buses', icon: BusIcon },
  { href: '/business/desk/conductors', label: 'Conductors', icon: UsersIcon },
  { href: '/business/desk/assignments', label: 'Assignments', icon: CalendarDays },
  { href: '/business/desk/routes', label: 'Routes & fares', icon: Map },
  { href: '/business/desk/lost', label: 'Lost & found', icon: LostIcon },
  { href: '/business/desk/payouts', label: 'Payouts', icon: WalletIcon },
  { href: '/business/desk/settings', label: 'Settings', icon: GearIcon },
];

export function OwnerFrame({ children, openLost }: { children: ReactNode; openLost: number }) {
  const path = usePathname();
  return (
    <div className="min-h-dvh bg-[#EFEAE3] p-2 text-[#14241C] md:p-4">
      <div className="mx-auto flex min-h-[calc(100dvh-1rem)] max-w-[1280px] flex-col overflow-hidden rounded-[28px] bg-[#F7F5F0] shadow-[0_24px_80px_rgba(20,36,28,0.12)] md:min-h-[calc(100dvh-2rem)] md:flex-row">
        <aside className="flex shrink-0 flex-col bg-[#0C4A32] text-white md:w-[232px]">
          <div className="flex items-center gap-3 px-4 py-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E8833A]"><BusIcon className="h-6 w-6" /></span>
            <span>
              <span className="block text-[15px] font-semibold leading-tight">Fleet Business</span>
              <span className="block text-[10px] font-semibold tracking-[0.14em] text-white/70">KALAMBATA TRANSPORT</span>
            </span>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:px-3" aria-label="Fleet">
            {LINKS.map((link) => {
              const active = link.href === '/business/desk' ? path === '/business/desk' : path.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className={`flex min-h-12 shrink-0 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${active ? 'bg-[#1B6B48] text-white' : 'text-white/80'}`}>
                  <Icon className="h-5 w-5" />
                  {link.label}
                  {link.href === '/business/desk/lost' && openLost > 0 ? <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#E8833A] px-1 text-[11px] text-white">{openLost}</span> : null}
                </Link>
              );
            })}
          </nav>
          <form action={signOutAction} className="mt-auto hidden px-3 py-4 md:block">
            <button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm text-white/80">
              <LogoutIcon className="h-5 w-5" /> Logout
            </button>
          </form>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function RangeLinks({ range, route }: { range: string; route?: string }) {
  const items = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
  ];
  return (
    <div className="flex rounded-full bg-white p-1 shadow-sm">
      {items.map((item) => {
        const params = new URLSearchParams({ range: item.id });
        if (route && route !== 'all') params.set('route', route);
        const active = range === item.id;
        return (
          <Link key={item.id} href={`/business/desk?${params.toString()}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? 'bg-[#F3EFE7] text-[#14241C]' : 'text-[#6A756E]'}`}>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function RouteSelect({ range, route, routes }: { range: string; route: string; routes: { fleetNumber: string; route: string }[] }) {
  return (
    <form action="/business/desk">
      <input type="hidden" name="range" value={range} />
      <select
        name="route"
        defaultValue={route}
        aria-label="Route"
        className="h-10 rounded-full border border-[#E4DDD2] bg-white px-3 text-sm"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="all">All routes</option>
        {routes.map((item) => (
          <option key={item.fleetNumber} value={item.fleetNumber}>Bus {item.fleetNumber}</option>
        ))}
      </select>
    </form>
  );
}

export function StatusPill({ status }: { status: 'active' | 'offline' | string }) {
  const active = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${active ? 'text-[#1C7A45]' : 'text-[#8A918C]'}`}>
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-[#1DB972]' : 'bg-[#C8C2B6]'}`} />
      {active ? 'Active' : 'Offline'}
    </span>
  );
}
