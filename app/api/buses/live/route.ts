import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listLiveBuses, simulatedEnabled, stopsFor } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const parameters = new URL(request.url).searchParams;
  const role = parameters.get('role') ?? 'passenger';
  if (role !== 'passenger' && role !== 'operator') return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const user = await getCurrentUser(role);
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const buses = await listLiveBuses(user);
  const snapshot = { buses, demo: simulatedEnabled(), now: Date.now() };
  const headers = { 'Cache-Control': 'private, no-store' };
  if (parameters.get('compact') === '1') return NextResponse.json(snapshot, { headers });
  const routes = [...new Set(buses.flatMap((bus) => (bus.route ? [bus.route] : [])))];
  const stops = await Promise.all(routes.map(async (route) => ({ route, stops: await stopsFor(route) })));
  const landmarks = await stopsFor('Landmarks');
  return NextResponse.json(
    { ...snapshot, stops, landmarks }, { headers },
  );
}
