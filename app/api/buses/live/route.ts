import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listLiveBuses, simulatedEnabled, stopsFor } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const buses = await listLiveBuses(user);
  const routes = [...new Set(buses.flatMap((bus) => (bus.route ? [bus.route] : [])))];
  const stops = await Promise.all(routes.map(async (route) => ({ route, stops: await stopsFor(route) })));
  const landmarks = await stopsFor('Landmarks');
  return NextResponse.json(
    { buses, stops, landmarks, demo: simulatedEnabled(), now: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
