'use client';

import { useActionState } from 'react';
import { assignConductorAction, payoutAction, registerBusAction, registerConductorAction, savePayoutAction, setBusStatusAction, verifyPickupAction } from '@/lib/actions';
import type { BusPerformance, ConductorOption, Fail } from '@/lib/types';
import { useState } from 'react';
import { buttonClass } from './shell';

export function RegisterBusForm() {
  const [state, action, pending] = useActionState(registerBusAction, null as Fail | null);
  return (
    <form action={action} className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-4">
      <input name="fleet" required placeholder="Fleet number" aria-label="Fleet number" className="h-14 rounded-2xl border border-[#E8E2D8] px-4" />
      <input name="plate" required placeholder="Plate, BLZ 44 ZA" aria-label="Plate" className="h-14 rounded-2xl border border-[#E8E2D8] px-4" />
      <input name="route" required placeholder="Route" aria-label="Route" className="h-14 rounded-2xl border border-[#E8E2D8] px-4" />
      <button className={buttonClass('copper')} disabled={pending}>{pending ? 'Saving…' : 'Register bus'}</button>
      {state?.message ? <p className="text-sm text-[#9A3B1A] md:col-span-4">{state.message}</p> : null}
    </form>
  );
}

export function RegisterConductorForm({ buses }: { buses: BusPerformance[] }) {
  const [state, action, pending] = useActionState(registerConductorAction, null as Fail | null);
  return (
    <form action={action} className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm md:grid-cols-2">
      <input name="name" required placeholder="Name" aria-label="Conductor name" className="h-14 rounded-2xl border border-[#E8E2D8] px-4" />
      <input name="phone" required placeholder="Phone" aria-label="Phone" className="h-14 rounded-2xl border border-[#E8E2D8] px-4" />
      <input name="pin" required inputMode="numeric" maxLength={4} placeholder="4-digit PIN" aria-label="PIN" className="h-14 rounded-2xl border border-[#E8E2D8] px-4" />
      <select name="busId" aria-label="Assign bus" className="h-14 rounded-2xl border border-[#E8E2D8] bg-white px-4" defaultValue="">
        <option value="">Assign later</option>
        {buses.map((bus) => <option key={bus.id} value={bus.id}>Bus {bus.fleetNumber}</option>)}
      </select>
      <button className={`${buttonClass('copper')} md:col-span-2`} disabled={pending}>{pending ? 'Saving…' : 'Register conductor'}</button>
      {state?.message ? <p className="text-sm text-[#9A3B1A] md:col-span-2">{state.message}</p> : null}
    </form>
  );
}

export function BusControls({ bus, conductors }: { bus: BusPerformance; conductors: ConductorOption[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={setBusStatusAction}>
        <input type="hidden" name="busId" value={bus.id} />
        <input type="hidden" name="status" value={bus.status === 'active' ? 'offline' : 'active'} />
        <button className="h-10 rounded-full border border-[#E4DDD2] px-3 text-sm">{bus.status === 'active' ? 'Take offline' : 'Mark active'}</button>
      </form>
      <form action={assignConductorAction} className="flex items-center gap-2">
        <input type="hidden" name="busId" value={bus.id} />
        <select name="conductorId" defaultValue={bus.conductorId ?? ''} aria-label={`Conductor for bus ${bus.fleetNumber}`} className="h-10 rounded-full border border-[#E4DDD2] bg-white px-3 text-sm">
          <option value="">Unassigned</option>
          {conductors.map((conductor) => <option key={conductor.id} value={conductor.id}>{conductor.shortName}</option>)}
        </select>
        <button className="h-10 rounded-full bg-[#0B5D3B] px-3 text-sm font-semibold text-white">Assign</button>
      </form>
    </div>
  );
}

export function PayoutForms({ phone, network, today }: { phone: string; network: string; today: string }) {
  const [saved, save, saving] = useActionState(savePayoutAction, null as Fail | null);
  const [paid, pay, paying] = useActionState(payoutAction, null);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form action={save} className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Payout destination</h2>
        <select name="network" defaultValue={network || 'mtn'} className="mt-3 h-14 w-full rounded-2xl border border-[#E8E2D8] bg-white px-4" aria-label="Network">
          <option value="mtn">MTN MoMo</option>
          <option value="airtel">Airtel Money</option>
          <option value="zamtel">Zamtel Kwacha</option>
          <option value="bank">Bank account</option>
        </select>
        <input name="destination" defaultValue={phone} aria-label="Destination" className="mt-2 h-14 w-full rounded-2xl border border-[#E8E2D8] px-4" />
        <button className={`${buttonClass('green')} mt-3`} disabled={saving}>{saving ? 'Saving…' : 'Save destination'}</button>
        {saved?.message ? <p className="mt-2 text-sm text-[#9A3B1A]">{saved.message}</p> : null}
      </form>
      <form action={pay} className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Request payout</h2>
        <p className="mt-1 text-sm text-[#5C6B63]">Simulated. Today’s takings are {today}. No Twende fee is deducted yet.</p>
        <input name="amount" defaultValue={today.replace(/[^\d.]/g, '')} aria-label="Amount in kwacha" className="mt-3 h-14 w-full rounded-2xl border border-[#E8E2D8] px-4" />
        <button className={`${buttonClass('copper')} mt-3`} disabled={paying}>{paying ? 'Sending…' : 'Pay out'}</button>
        {paid && 'message' in paid ? <p className={`mt-2 text-sm ${paid.ok ? 'text-[#0B5D3B]' : 'text-[#9A3B1A]'}`}>{paid.message}</p> : null}
      </form>
    </div>
  );
}

export function PickupClose() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form className="rounded-3xl bg-white p-4 shadow-sm" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      const result = await verifyPickupAction(code);
      setPending(false);
      if (!result.ok) setError(result.message);
      else {
        setError(null);
        setMessage(result.message);
        setCode('');
      }
    }}>
      <h2 className="font-semibold">Close a pickup</h2>
      <p className="mt-1 text-sm text-[#5C6B63]">Ask the passenger for the code on their phone. It is not shown here.</p>
      <div className="mt-3 flex gap-2">
        <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={4} aria-label="Pickup code" className="h-14 min-w-0 flex-1 rounded-2xl border border-[#E8E2D8] px-4 tracking-[0.2em]" />
        <button className="h-14 rounded-full bg-[#0B5D3B] px-5 font-semibold text-white" disabled={pending}>{pending ? '…' : 'Close'}</button>
      </div>
      {message ? <p className="mt-2 text-sm text-[#0B5D3B]">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#9A3B1A]">{error}</p> : null}
    </form>
  );
}
