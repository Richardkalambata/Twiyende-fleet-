import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { endShift, openShift, startShift } from '@/lib/tracking';
import { getDb } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'conductor') return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const shift = await openShift(user.id);
  if (!shift) return NextResponse.json({ sharing: false });
  const bus = await (await getDb()).get<{ fleet_number: string; route: string }>(`SELECT fleet_number, route FROM buses WHERE id = ?`, shift.bus_id);
  return NextResponse.json({ sharing: true, busId: shift.bus_id, fleet: bus?.fleet_number, route: bus?.route });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'conductor') return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: string } | null;
  if (body?.action === 'end') {
    await endShift(user.id);
    return NextResponse.json({ sharing: false });
  }
  const result = await startShift(user.id);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ sharing: true, busId: result.busId, fleet: result.fleet, route: result.route });
}
