'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Notice } from '@/lib/types';
import { BellIcon } from './icons';

export function Bell({ notices, tone = 'light' }: { notices: Notice[]; tone?: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false);
  const light = tone === 'light';
  return (
    <div className="relative">
      <button
        type="button"
        className={`relative grid h-11 w-11 place-items-center rounded-full ${light ? 'text-white' : 'text-[#14241C]'}`}
        aria-expanded={open}
        aria-label={notices.length ? `${notices.length} notifications` : 'Notifications'}
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon className="h-6 w-6" />
        {notices.length > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#E8833A]" /> : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-2xl bg-white p-2 text-[#14241C] shadow-xl">
          {notices.length === 0 ? <p className="px-3 py-4 text-sm text-[#5C6B63]">You’re up to date.</p> : null}
          {notices.map((notice) => (
            <Link key={notice.id} href={notice.href} className="block rounded-xl px-3 py-3 hover:bg-[#F7F5F0]" onClick={() => setOpen(false)}>
              <span className="block text-sm font-semibold">{notice.title}</span>
              <span className="block text-xs text-[#5C6B63]">{notice.body}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
