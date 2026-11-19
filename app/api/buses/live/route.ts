import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listLiveBuses, stopsFor } from '@/lib/tracking';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const buses = await listLiveBuses(user);
  const routes = [...new Set(buses.map((bus) => bus.route))];
  const stops = user.role === 'passenger'
    ? await Promise.all(routes.map(async (route) => ({ route, stops: await stopsFor(route) })))
    : [];
  return NextResponse.json({ buses, stops, now: Date.now() });
}
