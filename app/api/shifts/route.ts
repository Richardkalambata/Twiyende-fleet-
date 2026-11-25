import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { endShift, openShift, startShift } from '@/lib/tracking';
import { getDb } from '@/lib/db';
import { startOfLusakaDay } from '@/lib/time';

export async function GET() {
  const user = await getCurrentUser('conductor');
  if (!user || user.role !== 'conductor') return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const shift = await openShift(user.id);
  if (!shift) return NextResponse.json({ sharing: false });
  const db = await getDb();
  const bus = await db.get<{ fleet_number: string; route: string }>(`SELECT fleet_number, route FROM buses WHERE id = ?`, shift.bus_id);
  const verified = await db.get<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM rides WHERE conductor_id = ? AND status = 'verified' AND created_at >= ?`,
    user.id,
    startOfLusakaDay(),
  );
  const latest = await db.get<{ lat: number; lng: number }>(`SELECT lat, lng FROM bus_latest WHERE bus_id = ?`, shift.bus_id);
  return NextResponse.json({
    sharing: true,
    busId: shift.bus_id,
    fleet: bus?.fleet_number,
    route: bus?.route,
    startedAt: shift.started_at,
    verified: verified?.n ?? 0,
    lat: latest?.lat ?? null,
    lng: latest?.lng ?? null,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser('conductor');
  if (!user || user.role !== 'conductor') return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: string } | null;
  if (body?.action === 'end') {
    await endShift(user.id);
    return NextResponse.json({ sharing: false });
  }
  if (body?.action !== 'start') return NextResponse.json({ error: 'Invalid shift action' }, { status: 400 });
  const result = await startShift(user.id);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ sharing: true, busId: result.busId, fleet: result.fleet, route: result.route, startedAt: result.startedAt, verified: 0 });
}
