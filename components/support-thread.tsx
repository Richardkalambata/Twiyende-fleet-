'use client';

import { useActionState } from 'react';
import { replySupportAction, updateOperatorLostAction } from '@/lib/actions';
import { ConductorRefresh } from './conductor-refresh';

export function SupportThread({ id, status, messages, viewer, operator }: {
  id: string; status: string; viewer: string; operator: boolean;
  messages: { id: string; author_id: string; body: string; created_at: number }[];
}) {
  const [result, send, pending] = useActionState(replySupportAction.bind(null, operator ? 'operator' : 'passenger'), null);
  return (
    <section className="space-y-4">
      <ConductorRefresh />
      <ol aria-label="Support conversation" className="space-y-3">
        {messages.map((message) => <li key={message.id} className={`max-w-[85%] rounded-2xl p-3 ${message.author_id === viewer ? 'ml-auto bg-[#E7EEFF]' : 'bg-white'}`}>
          <p className="text-xs font-bold text-[#5C6578]">{message.author_id === viewer ? 'You' : operator ? 'Passenger' : 'Operator'}</p>
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          <time className="text-xs text-[#5C6578]">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Lusaka' }).format(message.created_at)}</time>
        </li>)}
      </ol>
      {status === 'open' ? (
        <form action={send} className="space-y-2 rounded-2xl bg-white p-3">
          <input type="hidden" name="ticketId" value={id} />
          <label className="block text-sm font-bold">Reply
            <textarea name="body" required minLength={2} maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border border-[#D5DCE8] p-3" />
          </label>
          {operator ? <label className="block text-sm"><input type="checkbox" name="close" /> Close ticket after reply</label> : null}
          <button disabled={pending} className="min-h-11 rounded-xl bg-[#184BDE] px-4 font-bold text-white disabled:opacity-50">{pending ? 'Sending…' : 'Send reply'}</button>
          {result ? <p role={result.ok ? 'status' : 'alert'} className="text-sm">{result.message}</p> : null}
        </form>
      ) : <p className="text-sm font-semibold">Conversation closed.</p>}
    </section>
  );
}

export function OperatorLostActions({ id }: { id: string }) {
  const [result, update, pending] = useActionState(updateOperatorLostAction, null);
  return (
    <form action={update} className="mt-3 flex flex-wrap gap-2">
      <input type="hidden" name="itemId" value={id} />
      <button name="outcome" value="found" disabled={pending} className="min-h-10 rounded-xl bg-[#184BDE] px-3 text-sm font-bold text-white">Found it</button>
      <button name="outcome" value="not-found" disabled={pending} className="min-h-10 rounded-xl border border-[#D5DCE8] px-3 text-sm font-bold">Not found</button>
      {result ? <p role={result.ok ? 'status' : 'alert'} className="w-full text-sm">{result.message}</p> : null}
    </form>
  );
}
