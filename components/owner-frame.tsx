'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Coins, Map } from 'lucide-react';
import { signOutAction } from '@/lib/actions';
import { Logo } from './shell';
import { BusIcon, ChartIcon, CloseIcon, GearIcon, LogoutIcon, LostIcon, MenuIcon, UsersIcon, WalletIcon } from './icons';

const LINKS = [
  { href: '/business/desk', label: 'Overview', icon: ChartIcon },
  { href: '/business/desk/fares', label: 'Fares', icon: Coins },
  { href: '/business/desk/map', label: 'Map', icon: Map },
  { href: '/business/desk/buses', label: 'Buses', icon: BusIcon },
  { href: '/business/desk/conductors', label: 'Conductors', icon: UsersIcon },
  { href: '/business/desk/assignments', label: 'Assignments', icon: CalendarDays },
  { href: '/business/desk/routes', label: 'Routes & fares', icon: Map },
  { href: '/business/desk/lost', label: 'Lost & found', icon: LostIcon },
  { href: '/business/desk/payouts', label: 'Payouts', icon: WalletIcon },
  { href: '/business/desk/settings', label: 'Settings', icon: GearIcon },
  { href: '/business/desk/support', label: 'Support', icon: LostIcon },
];

export function OwnerFrame({ children, openLost, operator, company }: { children: ReactNode; openLost: number; company: string; operator: { name: string; initials: string } }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div data-workspace="true" className="min-h-dvh w-full bg-[#F4F6FB] text-[#0B1B3B] lg:flex">
      <aside className="relative flex shrink-0 flex-col bg-[#0B1B3B] text-white lg:sticky lg:top-0 lg:h-dvh lg:w-56">
        <div className="flex items-center justify-between px-4 py-4 lg:px-7 lg:pt-8 lg:pb-6">
          <Logo tone="light" business />
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3"
              aria-expanded={menuOpen}
              aria-controls="operator-account-menu"
              aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
              onClick={() => { setMenuOpen((open) => !open); setNavOpen(false); }}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[12px] font-bold text-[#0B1B3B]">{operator.initials}</span>
              <span className="max-w-[39vw] truncate text-sm font-semibold" title={operator.name}>{operator.name}</span>
            </button>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 md:hidden"
              aria-expanded={navOpen}
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              onClick={() => { setNavOpen((open) => !open); setMenuOpen(false); }}
            >
              {navOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="mx-3 mb-3 hidden items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[13px] font-semibold lg:flex">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-white/15"><BusIcon className="h-3.5 w-3.5" /></span>
          <span className="truncate">{company}</span>
        </div>
        <nav className="hidden gap-1 px-2 pb-3 md:flex md:overflow-x-auto lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:px-4" aria-label="Fleet">
          {LINKS.map((link) => {
            const active = link.href === '/business/desk' ? path === '/business/desk' : path.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)} className={`relative flex h-10 shrink-0 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold lg:h-14 lg:px-4 ${active ? 'bg-[#1F5BFF] text-white lg:bg-white lg:text-[#0B1B3B]' : 'text-white/70 hover:bg-white/10'}`}>
                <Icon className="h-5 w-5" />
                {link.label}
                {link.href === '/business/desk/lost' && openLost > 0 ? <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#1F5BFF] px-1 text-[11px] text-white">{openLost}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 px-3 py-3 lg:block">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[12px] font-bold text-[#0B1B3B]">{operator.initials}</span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{operator.name}</span>
              <span className="block text-[11px] text-white/60">Operator</span>
            </span>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] font-semibold text-white hover:bg-white/10">
              <LogoutIcon className="h-5 w-5" />
              Log out
            </button>
          </form>
        </div>
        {navOpen ? (
          <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1B3B] text-white md:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo tone="light" business />
              <button type="button" className="grid h-11 w-11 place-items-center rounded-full bg-white/10" aria-label="Close menu" onClick={() => setNavOpen(false)}>
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="px-5 text-[13px] text-white/70">{company}</p>
            <nav className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="Fleet menu">
              {LINKS.map((link) => {
                const active = link.href === '/business/desk' ? path === '/business/desk' : path.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setNavOpen(false)} className={`flex h-12 items-center gap-3 rounded-xl px-3 text-[16px] font-semibold ${active ? 'bg-[#1F5BFF] text-white' : 'text-white/80'}`}>
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <form action={signOutAction} className="p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
              <button type="submit" className="press flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-bold text-[#0B1B3B]">
                <LogoutIcon className="h-5 w-5" />
                Log out
              </button>
            </form>
          </div>
        ) : null}
        {menuOpen ? (
          <div id="operator-account-menu" className="absolute inset-x-3 top-full z-40 mt-2 rounded-2xl bg-white p-3 text-[#0B1B3B] shadow-[0_16px_40px_rgba(11,27,59,0.18)] lg:hidden">
            <p className="px-1 text-[15px] font-bold">{operator.name}</p>
            <p className="px-1 text-[13px] text-[#5C6578]">Operator</p>
            <Link href="/business/desk/settings" onClick={() => setMenuOpen(false)} className="mt-3 flex h-12 items-center gap-3 rounded-xl bg-[#F4F6FB] px-3 text-[15px] font-semibold text-[#0B1B3B]">
              <GearIcon className="h-5 w-5" />
              Settings
            </Link>
            <form action={signOutAction} className="mt-2">
              <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1B3B] text-[15px] font-bold text-white">
                <LogoutIcon className="h-5 w-5" />
                Log out
              </button>
            </form>
          </div>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
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
          <Link key={item.id} href={`/business/desk?${params.toString()}`} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? 'bg-[#1F5BFF] text-white' : 'bg-white text-[#0B1B3B]'}`}>
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
        className="h-10 rounded-full border border-[#E4E8F0] bg-white px-3 text-sm text-[#0B1B3B]"
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
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-[#12B76A]' : 'bg-[#C8C2B6]'}`} />
      {active ? 'Active' : 'Offline'}
    </span>
  );
}
