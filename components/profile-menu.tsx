'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, CircleHelp, KeyRound, LogOut, Pencil } from 'lucide-react';
import { signOutAction } from '@/lib/actions';
import { ProfileForms } from './account-forms';
import type { Notice } from '@/lib/types';

export function ProfileMenu({ name, notices }: { name: string; notices: Notice[] }) {
  const [open, setOpen] = useState<'edit' | 'pin' | 'notes' | null>(null);
  const unread = notices.filter((notice) => notice.unread).length;
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(11,27,59,0.06)]">
      <Row icon={<Pencil className="h-5 w-5" />} label="Edit personal details" onClick={() => setOpen(open === 'edit' ? null : 'edit')} />
      {open === 'edit' ? <div className="border-t border-[#E6EAF2] p-3"><ProfileForms name={name} mode="name" /></div> : null}
      <Row icon={<KeyRound className="h-5 w-5" />} label="Change PIN" onClick={() => setOpen(open === 'pin' ? null : 'pin')} />
      {open === 'pin' ? <div className="border-t border-[#E6EAF2] p-3"><ProfileForms name="" mode="pin" /></div> : null}
      <Row icon={<Bell className="h-5 w-5" />} label="Notifications" detail={unread > 0 ? String(unread) : undefined} onClick={() => setOpen(open === 'notes' ? null : 'notes')} />
      {open === 'notes' ? (
        <ul className="border-t border-[#E6EAF2] px-4 py-2">
          {notices.length === 0 ? <li className="py-3 text-[14px] text-[#5C6578]">You are up to date.</li> : null}
          {notices.map((notice) => (
            <li key={notice.id} className="border-b border-[#F0F2F7] py-3 last:border-0">
              <Link href={notice.href} className="block">
                <span className="block text-[15px] font-semibold">{notice.title}</span>
                <span className="block text-[13px] text-[#5C6578]">{notice.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <Link href="/help" className="flex min-h-14 items-center gap-3 border-t border-[#E6EAF2] px-4 text-[15px] font-semibold">
        <CircleHelp className="h-5 w-5 text-[#5C6578]" />
        Help & support
        <ChevronRight className="ml-auto h-4 w-4 text-[#8A93A6]" />
      </Link>
      <form action={signOutAction} className="border-t border-[#E6EAF2]">
        <button type="submit" className="press flex min-h-14 w-full items-center gap-3 px-4 text-left text-[15px] font-semibold">
          <LogOut className="h-5 w-5 text-[#5C6578]" />
          Log out
        </button>
      </form>
    </div>
  );
}

function Row({ icon, label, detail, onClick }: { icon: ReactNode; label: string; detail?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="press flex min-h-14 w-full items-center gap-3 border-t border-[#E6EAF2] px-4 text-left text-[15px] font-semibold first:border-t-0">
      <span className="text-[#5C6578]">{icon}</span>
      {label}
      {detail ? <span className="ml-auto rounded-full bg-[#E7EEFF] px-2 py-0.5 text-[12px] font-bold text-[#1F5BFF]">{detail}</span> : <ChevronRight className="ml-auto h-4 w-4 text-[#8A93A6]" />}
    </button>
  );
}
