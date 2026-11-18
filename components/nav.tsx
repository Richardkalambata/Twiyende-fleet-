'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BusIcon, HomeIcon, LostIcon, RidesIcon, ShieldIcon, UserIcon } from './icons';

function Item({ href, label, active, children }: { href: string; label: string; active: boolean; dark?: boolean; children: ReactNode }) {
  return (
    <Link href={href} className={`nav-item flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[12px] font-semibold ${active ? 'text-[#0B1B3B]' : 'text-[#D5DCEC]'}`}>
      {children}
      <span>{label}</span>
    </Link>
  );
}

function Bar({ label, index, children }: { label: string; index: number; children: ReactNode }) {
  return (
    <nav className="px-4 pb-[max(12px,env(safe-area-inset-bottom))]" aria-label={label}>
      <div className="nav-bar glass grid grid-cols-4 rounded-full p-1.5" style={{ ['--i' as string]: index }}>
        <span className="nav-pill" aria-hidden />
        {children}
      </div>
    </nav>
  );
}

export function PassengerNav() {
  const path = usePathname();
  const tabs = [
    path === '/home',
    path.startsWith('/rides'),
    path.startsWith('/help') || path.startsWith('/lost'),
    path.startsWith('/profile'),
  ];
  const index = Math.max(0, tabs.findIndex(Boolean));
  return (
    <Bar label="Passenger" index={index}>
      <Item href="/home" label="Home" active={tabs[0]}><HomeIcon className="h-5 w-5" /></Item>
      <Item href="/rides" label="Rides" active={tabs[1]}><RidesIcon className="h-5 w-5" /></Item>
      <Item href="/help" label="Help" active={tabs[2]}><LostIcon className="h-5 w-5" /></Item>
      <Item href="/profile" label="Profile" active={tabs[3]}><UserIcon className="h-5 w-5" /></Item>
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
    <Bar label="Conductor" index={index}>
      <Item href="/business/drive" label="Verify" active={tabs[0]}><ShieldIcon className="h-5 w-5" /></Item>
      <Item href="/business/drive/trips" label="Trips" active={tabs[1]}><BusIcon className="h-5 w-5" /></Item>
      <Item href="/business/drive/lost" label="Lost" active={tabs[2]}><LostIcon className="h-5 w-5" /></Item>
      <Item href="/business/drive/profile" label="Profile" active={tabs[3]}><UserIcon className="h-5 w-5" /></Item>
    </Bar>
  );
}
