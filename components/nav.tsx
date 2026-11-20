'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BusIcon, HomeIcon, LostIcon, RidesIcon, ShieldIcon, UserIcon } from './icons';
import { Logo } from './shell';
import { LogOut, Map } from 'lucide-react';
import { signOutAction } from '@/lib/actions';

function Item({ href, label, active, children }: { href: string; label: string; active: boolean; dark?: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={`nav-item flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[12px] font-semibold lg:h-14 lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-4 lg:text-sm ${active ? 'text-[#0B1B3B] lg:!bg-white' : 'text-[#D5DCEC]'}`}>
      {children}
      <span>{label}</span>
    </Link>
  );
}

function Bar({ label, index, cols, children }: { label: string; index: number; cols: number; children: ReactNode }) {
  return (
    <nav className="px-4 pb-[max(12px,env(safe-area-inset-bottom))] lg:flex lg:h-full lg:flex-col lg:pt-8" aria-label={label}>
      <div className="mb-8 hidden px-3 lg:block"><Logo tone="light" business={label === 'Conductor'} /></div>
      <div className={`nav-bar glass grid rounded-full p-1.5 lg:flex lg:flex-col lg:gap-2 lg:rounded-none lg:!bg-transparent lg:!shadow-none ${cols === 5 ? 'grid-cols-5' : 'grid-cols-4'}`} style={{ ['--i' as string]: index, ['--cols' as string]: cols }}>
        <span className="nav-pill lg:hidden" aria-hidden />
        {children}
      </div>
      <form action={signOutAction} className="mt-1 lg:mt-auto lg:border-t lg:border-white/20 lg:pt-4">
        <button type="submit" className="flex min-h-9 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold lg:min-h-12 lg:justify-start lg:text-white lg:hover:bg-white/10">
          <LogOut className="size-4" aria-hidden /> Log out
        </button>
      </form>
    </nav>
  );
}

export function PassengerNav() {
  const path = usePathname();
  const tabs = [
    path === '/home',
    path.startsWith('/map'),
    path.startsWith('/rides'),
    path.startsWith('/help') || path.startsWith('/lost'),
    path.startsWith('/profile'),
  ];
  const index = Math.max(0, tabs.findIndex(Boolean));
  return (
    <Bar label="Passenger" index={index} cols={5}>
      <Item href="/home" label="Home" active={tabs[0]}><HomeIcon className="h-5 w-5" /></Item>
      <Item href="/map" label="Map" active={tabs[1]}><Map className="h-5 w-5" /></Item>
      <Item href="/rides" label="Rides" active={tabs[2]}><RidesIcon className="h-5 w-5" /></Item>
      <Item href="/help" label="Help" active={tabs[3]}><LostIcon className="h-5 w-5" /></Item>
      <Item href="/profile" label="Profile" active={tabs[4]}><UserIcon className="h-5 w-5" /></Item>
    </Bar>
  );
}

export function ConductorNav() {
  const path = usePathname();
  const tabs = [
    path === '/business/drive',
    path.startsWith('/business/drive/trips'),
    path.startsWith('/business/drive/lost'),
    path.startsWith('/business/drive/profile'),
  ];
  const index = Math.max(0, tabs.findIndex(Boolean));
  return (
    <Bar label="Conductor" index={index} cols={4}>
      <Item href="/business/drive" label="Verify" active={tabs[0]}><ShieldIcon className="h-5 w-5" /></Item>
      <Item href="/business/drive/trips" label="Trips" active={tabs[1]}><BusIcon className="h-5 w-5" /></Item>
      <Item href="/business/drive/lost" label="Lost" active={tabs[2]}><LostIcon className="h-5 w-5" /></Item>
      <Item href="/business/drive/profile" label="Profile" active={tabs[3]}><UserIcon className="h-5 w-5" /></Item>
    </Bar>
  );
}
