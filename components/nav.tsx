'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BusIcon, HomeIcon, LostIcon, RidesIcon, ShieldIcon, UserIcon } from './icons';

function Item({
  href,
  label,
  active,
  dark,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  dark?: boolean;
  children: ReactNode;
}) {
  const color = active ? (dark ? 'text-[#1DB972]' : 'text-[#0B5D3B]') : dark ? 'text-[#8B978F]' : 'text-[#8A918C]';
  return (
    <Link href={href} className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${color}`}>
      {children}
      {label}
    </Link>
  );
}

export function PassengerNav() {
  const path = usePathname();
  const active = (href: string) => (href === '/home' ? path === '/home' : path.startsWith(href));
  return (
    <nav className="grid shrink-0 grid-cols-4 border-t border-[#E7E1D6] bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Passenger">
      <Item href="/home" label="Home" active={active('/home')}><HomeIcon className="h-6 w-6" /></Item>
      <Item href="/rides" label="Trips" active={active('/rides')}><RidesIcon className="h-6 w-6" /></Item>
      <Item href="/lost" label="Lost & found" active={active('/lost')}><LostIcon className="h-6 w-6" /></Item>
      <Item href="/profile" label="Profile" active={active('/profile')}><UserIcon className="h-6 w-6" /></Item>
    </nav>
  );
}

export function ConductorNav() {
  const path = usePathname();
  const active = (href: string) => (href === '/business/drive' ? path === '/business/drive' : path.startsWith(href));
  return (
    <nav className="grid shrink-0 grid-cols-4 border-t border-white/10 bg-[#0E1411] pb-[env(safe-area-inset-bottom)]" aria-label="Conductor">
      <Item href="/business/drive" label="Verify" active={active('/business/drive')} dark><ShieldIcon className="h-6 w-6" /></Item>
      <Item href="/business/drive/trips" label="Trips" active={active('/business/drive/trips')} dark><BusIcon className="h-6 w-6" /></Item>
      <Item href="/business/drive/lost" label="Lost & found" active={active('/business/drive/lost')} dark><LostIcon className="h-6 w-6" /></Item>
      <Item href="/business/drive/profile" label="Profile" active={active('/business/drive/profile')} dark><UserIcon className="h-6 w-6" /></Item>
    </nav>
  );
}
