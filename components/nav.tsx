'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BusIcon, HomeIcon, LostIcon, RidesIcon, ShieldIcon, UserIcon } from './icons';

function Item({ href, label, active, children }: { href: string; label: string; active: boolean; dark?: boolean; children: ReactNode }) {
  return (
    <Link href={href} className={`flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[12px] font-semibold ${active ? 'bg-white text-[#0B1B3B]' : 'text-white/70'}`}>
      {children}
      <span>{label}</span>
    </Link>
  );
}

export function PassengerNav() {
  const path = usePathname();
  const on = (href: string) => (href === '/home' ? path === '/home' : path.startsWith(href));
  return (
    <nav className="px-4 pb-[max(12px,env(safe-area-inset-bottom))]" aria-label="Passenger">
      <div className="grid grid-cols-4 rounded-full bg-[#0B1B3B] p-1.5">
        <Item href="/home" label="Home" active={on('/home')}><HomeIcon className="h-5 w-5" /></Item>
        <Item href="/rides" label="Rides" active={on('/rides')}><RidesIcon className="h-5 w-5" /></Item>
        <Item href="/help" label="Help" active={on('/help') || on('/lost')}><LostIcon className="h-5 w-5" /></Item>
        <Item href="/profile" label="Profile" active={on('/profile')}><UserIcon className="h-5 w-5" /></Item>
      </div>
    </nav>
  );
}

export function ConductorNav() {
  const path = usePathname();
  const on = (href: string) => (href === '/business/drive' ? path === '/business/drive' : path.startsWith(href));
  return (
    <nav className="bg-[#F4F6FB] px-4 pb-[max(12px,env(safe-area-inset-bottom))]" aria-label="Conductor">
      <div className="grid grid-cols-4 rounded-full bg-[#0B1B3B] p-1.5">
        <Item href="/business/drive" label="Verify" active={on('/business/drive')}><ShieldIcon className="h-5 w-5" /></Item>
        <Item href="/business/drive/trips" label="Trips" active={on('/business/drive/trips')}><BusIcon className="h-5 w-5" /></Item>
        <Item href="/business/drive/lost" label="Lost" active={on('/business/drive/lost')}><LostIcon className="h-5 w-5" /></Item>
        <Item href="/business/drive/profile" label="Profile" active={on('/business/drive/profile')}><UserIcon className="h-5 w-5" /></Item>
      </div>
    </nav>
  );
}
