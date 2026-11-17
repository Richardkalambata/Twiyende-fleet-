'use client';

import { useActionState } from 'react';
import { changePinAction, updateProfileAction, saveCompanyAction } from '@/lib/actions';
import type { Fail } from '@/lib/types';

export function ProfileForms({ name }: { name: string }) {
  const [profile, saveProfile, saving] = useActionState(updateProfileAction, null as Fail | null);
  const [pin, savePin, pinning] = useActionState(changePinAction, null as Fail | null);
  return (
    <div className="space-y-3">
      <form action={saveProfile} className="rounded-2xl bg-white p-4">
        <h2 className="font-bold">Personal details</h2>
        <input name="name" defaultValue={name} aria-label="Name" className="mt-2 w-full border-0 border-b border-[#D5DCE8] bg-transparent py-2 text-[16px] font-semibold outline-none" />
        {profile?.message ? <p className="mt-2 text-sm text-[#E5484D]">{profile.message}</p> : null}
        <button className="mt-3 h-11 rounded-xl bg-[#1F5BFF] px-4 font-bold text-white" disabled={saving}>{saving ? 'Saving…' : 'Save name'}</button>
      </form>
      <form action={savePin} className="rounded-2xl bg-white p-4">
        <h2 className="font-bold">Change PIN</h2>
        <input name="current" inputMode="numeric" maxLength={4} placeholder="Current PIN" aria-label="Current PIN" className="mt-2 w-full border-0 border-b border-[#D5DCE8] bg-transparent py-2 outline-none" />
        <input name="next" inputMode="numeric" maxLength={4} placeholder="New 4-digit PIN" aria-label="New PIN" className="mt-2 w-full border-0 border-b border-[#D5DCE8] bg-transparent py-2 outline-none" />
        {pin?.message ? <p className="mt-2 text-sm text-[#E5484D]">{pin.message}</p> : null}
        <button className="mt-3 h-11 rounded-xl bg-[#0B1B3B] px-4 font-bold text-white" disabled={pinning}>{pinning ? 'Saving…' : 'Update PIN'}</button>
      </form>
    </div>
  );
}

export function CompanyForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(saveCompanyAction, null as Fail | null);
  return (
    <form action={action} className="rounded-2xl bg-white p-4">
      <h2 className="font-bold">Company</h2>
      <input name="company" defaultValue={name} aria-label="Company name" className="mt-2 h-12 w-full rounded-xl bg-[#F4F6FB] px-3 outline-none" />
      {state?.message ? <p className="mt-2 text-sm text-[#E5484D]">{state.message}</p> : null}
      <button className="mt-3 h-11 rounded-xl bg-[#1F5BFF] px-4 font-bold text-white" disabled={pending}>{pending ? 'Saving…' : 'Save company'}</button>
    </form>
  );
}

export function SupportForm({ action }: { action: (prev: Fail | null, formData: FormData) => Promise<Fail | null> }) {
  const [state, run, pending] = useActionState(action, null as Fail | null);
  return (
    <form action={run} className="mt-3 space-y-2">
      <input name="subject" required placeholder="Subject" aria-label="Subject" className="h-11 w-full rounded-xl bg-[#F4F6FB] px-3" />
      <textarea name="body" required placeholder="How can we help?" aria-label="Message" className="h-24 w-full rounded-xl bg-[#F4F6FB] px-3 py-2" />
      {state?.message?.startsWith('Sent') ? <p className="text-sm text-[#128A4E]">{state.message}</p> : state?.message ? <p className="text-sm text-[#E5484D]">{state.message}</p> : null}
      <button className="h-11 w-full rounded-xl bg-[#1F5BFF] font-bold text-white" disabled={pending}>Send</button>
    </form>
  );
}
