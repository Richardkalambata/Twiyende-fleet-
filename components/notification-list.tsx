import Link from 'next/link';
import { readNoticeAction } from '@/lib/actions';
import type { Role } from '@/lib/types';
import { formatRideWhen } from '@/lib/time';
import type { Notice } from '@/lib/types';

export function NotificationList({ role, notices }: { role: Role; notices: Notice[] }) {
  if (!notices.length) return <p className="rounded-2xl bg-white p-4 text-sm text-[#5C6578]">No notifications yet.</p>;
  return (
    <ul className="divide-y divide-[#E4E8F0] rounded-2xl bg-white px-4">
      {notices.map((notice) => (
        <li key={notice.id} className="flex flex-wrap items-start justify-between gap-2 py-4">
          <div className="min-w-0">
            <Link href={notice.href} className="font-bold text-[#1747CB] hover:underline">{notice.title}</Link>
            {notice.unread && <span className="ml-2 text-xs font-semibold text-[#5C6578]">New</span>}
            <p className="mt-1 text-sm text-[#0B1B3B]">{notice.body}</p>
            {notice.createdAt != null && <p className="mt-1 text-xs text-[#5C6578]">{formatRideWhen(notice.createdAt)}</p>}
          </div>
          {notice.unread && (
            <form action={readNoticeAction.bind(null, role)}>
              <input type="hidden" name="id" value={notice.id} />
              <button className="rounded-lg border border-[#D5DCE8] px-3 py-2 text-xs font-semibold text-[#0B1B3B]">Mark as read</button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
