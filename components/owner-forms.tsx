'use client';

import { useActionState } from 'react';
import { assignConductorAction, logOperatorFoundAction, payoutAction, registerBusAction, registerConductorAction, savePayoutAction, setBusRouteAction, setBusStatusAction, verifyPickupAction } from '@/lib/actions';
import { CONDUCTOR_CATEGORIES, categoryLabel } from '@/lib/categories';
import { LUSAKA_ROUTES } from '@/lib/lusaka-routes';
import type { BusPerformance, ConductorOption, Fail } from '@/lib/types';
import { useId, useState, type ReactNode } from 'react';
import { buttonClass } from './shell';

function Sheet({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="press flex h-12 w-full items-center justify-center rounded-xl bg-[#1F5BFF] text-[15px] font-bold text-white md:hidden" onClick={() => setOpen(true)}>{label}</button>
      <div className={open ? 'fixed inset-0 z-50 overflow-y-auto bg-[#F4F6FB] p-4 md:static md:z-auto md:overflow-visible md:bg-transparent md:p-0' : 'hidden md:block'}>
        {open ? (
          <button type="button" className="mb-3 text-[15px] font-semibold text-[#1F5BFF] md:hidden" onClick={() => setOpen(false)}>Close</button>
        ) : null}
        <h2 className="mb-3 text-[22px] font-extrabold md:hidden">{title}</h2>
        {children}
      </div>
    </>
  );
}

const registrationField = "h-12 w-full min-w-0 rounded-xl border border-[#AEB9CD] bg-[#F8FAFF] px-3 font-normal text-[#0B1B3B] placeholder:text-[#5C6578] focus-visible:outline-2 focus-visible:outline-[#1F5BFF]";

function RouteInput({ label, defaultValue = '', className }: { label: string; defaultValue?: string; className: string }) {
  const suggestions = useId();
  return (
    <>
      <input name="route" list={suggestions} defaultValue={defaultValue} maxLength={60} aria-label={label} placeholder="Choose or type a route" className={className} />
      <datalist id={suggestions}>
        {LUSAKA_ROUTES.map(({ route }) => <option key={route} value={route} />)}
      </datalist>
    </>
  );
}

export function RegisterBusForm({ conductors }: { conductors: ConductorOption[] }) {
  const [state, action, pending] = useActionState(registerBusAction, null as Fail | null);
  return (
    <Sheet label="Add bus" title="Add a bus">
    <form action={action} className="grid gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(11,27,59,0.06)] md:grid-cols-4">
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Fleet number (optional)
        <input name="fleet" inputMode="numeric" placeholder="Fleet number (optional)" aria-label="Fleet number" className={registrationField} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Number plate
        <input name="plate" required placeholder="Plate, BLZ 44 ZA" aria-label="Plate" className={registrationField} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Route
        <RouteInput label="Route" className={registrationField} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Conductor
        <select name="conductorId" aria-label="Assign conductor" className={registrationField}>
        <option value="">Assign conductor later</option>
        {conductors.map((person) => <option key={person.id} value={person.id}>{person.shortName}{person.busFleet ? ` · Bus ${person.busFleet}` : ''}</option>)}
      </select>
      </label>
      <p className="text-xs text-[#5C6578] md:col-span-4">Leave the fleet number blank to get an available number automatically.</p>
      <button className={`${buttonClass('copper')} md:col-span-4`} disabled={pending}>{pending ? 'Saving…' : 'Register bus'}</button>
      {state?.message ? <p className="text-sm text-[#9A3B1A] md:col-span-4">{state.message}</p> : null}
    </form>
    </Sheet>
  );
}

export function RegisterConductorForm({ buses }: { buses: BusPerformance[] }) {
  const [state, action, pending] = useActionState(registerConductorAction, null as Fail | null);
  return (
    <Sheet label="Add conductor" title="Add a conductor">
    <form action={action} className="grid gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(11,27,59,0.06)] md:grid-cols-2">
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Full name
        <input name="name" required placeholder="Name" aria-label="Conductor name" className={registrationField} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Mobile number
        <input name="phone" type="tel" autoComplete="tel" required placeholder="Phone" aria-label="Phone" className={registrationField} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">6-digit PIN
        <input name="pin" type="password" pattern="[0-9]{6}" autoComplete="new-password" required inputMode="numeric" maxLength={6} placeholder="6-digit PIN" aria-label="PIN" className={registrationField} />
      </label>
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold">Assigned bus
        <select name="busId" aria-label="Assign bus" className={registrationField} defaultValue="">
        <option value="">Assign later</option>
        {buses.map((bus) => <option key={bus.id} value={bus.id}>Bus {bus.fleetNumber}</option>)}
      </select>
      </label>
      <button className={`${buttonClass('copper')} md:col-span-2`} disabled={pending}>{pending ? 'Saving…' : 'Register conductor'}</button>
      {state?.message ? <p className="text-sm text-[#9A3B1A] md:col-span-2">{state.message}</p> : null}
    </form>
    </Sheet>
  );
}

export function BusControls({ bus, conductors }: { bus: BusPerformance; conductors: ConductorOption[] }) {
  const [routeResult, saveRoute, savingRoute] = useActionState(setBusRouteAction, null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={setBusStatusAction}>
        <input type="hidden" name="busId" value={bus.id} />
        <input type="hidden" name="status" value={bus.status === 'active' ? 'offline' : 'active'} />
        <button className="h-10 rounded-full border border-[#E4E8F0] bg-[#F1F4FA] px-3 text-sm text-[#0B1B3B]">{bus.status === 'active' ? 'Take offline' : 'Mark active'}</button>
      </form>
      <form action={saveRoute} className="flex items-center gap-2">
        <input type="hidden" name="busId" value={bus.id} />
        <RouteInput label={`Route for bus ${bus.fleetNumber}`} defaultValue={bus.route ?? ''} className="h-10 min-w-0 max-w-[180px] rounded-full bg-white px-3 text-sm text-[#0B1B3B]" />
        <button disabled={savingRoute} className="h-10 shrink-0 rounded-xl bg-[#1F5BFF] px-3 text-sm font-bold text-white">{savingRoute ? "Saving…" : "Save route"}</button>
      </form>
      {routeResult && <p className="basis-full text-sm" role={routeResult.ok ? "status" : "alert"}>{routeResult.message}</p>}
      <ConductorAssignmentForm bus={bus} conductors={conductors} />
    </div>
  );
}

export function ConductorAssignmentForm({ bus, conductors }: { bus: BusPerformance; conductors: ConductorOption[] }) {
  const [result, action, pending] = useActionState(assignConductorAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="busId" value={bus.id} />
      <select key={bus.conductorId ?? 'unassigned'} name="conductorId" defaultValue={bus.conductorId ?? ''} aria-label={`Conductor for bus ${bus.fleetNumber}`} className="h-10 min-w-0 rounded-xl border border-[#E4E8F0] bg-white px-3 text-sm">
        <option value="">Unassigned</option>
        {conductors.map((conductor) => <option key={conductor.id} value={conductor.id}>{conductor.shortName}{conductor.busFleet && conductor.busFleet !== bus.fleetNumber ? ` · Bus ${conductor.busFleet}` : ''}</option>)}
      </select>
      <button disabled={pending} className="h-10 rounded-xl bg-[#1F5BFF] px-3 text-sm font-bold text-white disabled:opacity-50">{pending ? 'Saving…' : 'Save assignment'}</button>
      {result ? <p role={result.ok ? 'status' : 'alert'} className="w-full text-sm">{result.message}</p> : null}
    </form>
  );
}

export function PayoutForms({ phone, network, today, locked }: { phone: string; network: string; today: string; locked: boolean }) {
  const [saved, save, saving] = useActionState(savePayoutAction, null as Fail | null);
  const [paid, pay, paying] = useActionState(payoutAction, null);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {locked ? (
        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Locked payout destination</h2>
          <p className="mt-2 text-sm">Account ending in {phone.slice(-4)}. Contact Twende support to change it.</p>
        </section>
      ) : <form action={save} className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Payout destination</h2>
        <p className="mt-1 text-sm text-[#5C6578]">Check the destination before saving. It will be locked to your account.</p>
        <select name="network" defaultValue={network || 'mtn'} className="mt-3 h-14 w-full rounded-2xl bg-white px-4 text-[#0B1B3B]" aria-label="Network">
          <option value="mtn">MTN MoMo</option>
          <option value="airtel">Airtel Money</option>
          <option value="zamtel">Zamtel Kwacha</option>
          <option value="bank">Bank account</option>
        </select>
        <input name="destination" defaultValue={phone} aria-label="Destination" className="mt-2 h-14 w-full rounded-2xl bg-white px-4 text-[#0B1B3B] placeholder:text-[#5C6578]" />
        <label className="mt-3 grid gap-1 text-sm font-semibold">Confirm your six-digit PIN
          <input name="pin" type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{6}" maxLength={6} required className={registrationField} />
        </label>
        <button className={`${buttonClass('green')} mt-3`} disabled={saving}>{saving ? 'Saving…' : 'Save destination'}</button>
        {saved?.message ? <p className="mt-2 text-sm text-[#9A3B1A]">{saved.message}</p> : null}
      </form>}
      <form action={pay} className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Request payout</h2>
        <p className="mt-1 text-sm text-[#5C6B63]">Simulated. Today’s takings are {today}. No Twende fee is deducted yet.</p>
        <input name="amount" defaultValue={today.replace(/[^\d.]/g, '')} aria-label="Amount in kwacha" className="mt-3 h-14 w-full rounded-2xl bg-white px-4 text-[#0B1B3B] placeholder:text-[#5C6578]" />
        <label className="mt-3 grid gap-1 text-sm font-semibold">Confirm your six-digit PIN
          <input name="pin" type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{6}" maxLength={6} required className={registrationField} />
        </label>
        <button className={`${buttonClass('copper')} mt-3`} disabled={paying || !locked}>{paying ? 'Sending…' : 'Pay out'}</button>
        {paid && 'message' in paid ? <p className={`mt-2 text-sm ${paid.ok ? 'text-[#1F5BFF]' : 'text-[#9A3B1A]'}`}>{paid.message}</p> : null}
      </form>
    </div>
  );
}

export function PickupClose({ items = [] }: { items?: { id: string; category: string; fleetNumber: string; pickupCode: string | null }[] }) {
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
      <h2 className="font-semibold">Save a return</h2>
      <p className="mt-1 text-sm text-[#5C6B63]">Select an unclaimed item or enter the code the passenger provides.</p>
      <select aria-label="Select item to return" value={items.some((item) => item.pickupCode === code) ? code : ''} onChange={(e) => setCode(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#D5DCE8] px-3">
        <option value="">Choose an item</option>
        {items.map((item) => <option key={item.id} value={item.pickupCode ?? ''}>Bus {item.fleetNumber} · {item.category} · {item.pickupCode}</option>)}
      </select>
      <div className="mt-3 flex gap-2">
        <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={8} aria-label="Pickup code" className="h-14 min-w-0 flex-1 rounded-2xl border border-[#AEB9CD] bg-white px-4 text-[#0B1B3B] tracking-[0.2em] placeholder:text-[#5C6578]" />
        <button className="h-12 rounded-xl bg-[#1F5BFF] px-5 font-bold text-white" disabled={pending || code.length < 4}>{pending ? 'Saving…' : 'Save return'}</button>
      </div>
      {message ? <p className="mt-2 text-sm text-[#1F5BFF]">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-[#9A3B1A]">{error}</p> : null}
    </form>
  );
}


export function OperatorLogFound({ buses }: { buses: BusPerformance[] }) {
  const [result, submit, pending] = useActionState(logOperatorFoundAction, null);
  return (
    <form action={submit} className="space-y-3 rounded-2xl bg-white p-4">
      <h2 className="font-semibold">Log a found item</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">Bus
          <select name="busId" required defaultValue="" className={registrationField}>
            <option value="">Choose a bus</option>
            {buses.map((bus) => <option key={bus.id} value={bus.id}>Bus {bus.fleetNumber}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Category
          <select name="category" required defaultValue="" className={registrationField}>
            <option value="">Choose a category</option>
            {CONDUCTOR_CATEGORIES.map((id) => <option key={id} value={id}>{categoryLabel(id)}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">Description
        <input name="description" maxLength={280} className={registrationField} />
      </label>
      <button className={buttonClass('copper')} disabled={pending || !buses.length}>{pending ? 'Saving…' : 'Save found item'}</button>
      {result ? <p role={result.ok ? 'status' : 'alert'} className="text-sm">{result.message}</p> : null}
    </form>
  );
}
