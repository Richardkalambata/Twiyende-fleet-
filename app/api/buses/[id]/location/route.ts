import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { recordConductorLocation } from '@/lib/tracking';
import { readTrackingRequest } from '@/lib/tracking-request';

function optionalNumber(value: unknown): value is number | null | undefined {
  return value == null || (typeof value === 'number' && Number.isFinite(value));
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser('conductor');
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  if (user.role !== 'conductor') return NextResponse.json({ error: 'Conductors only' }, { status: 403 });
  const { id } = await context.params;
  const input = await readTrackingRequest(request);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: input.status });
  const { lat, lng, heading, speed, accuracy } = input.body;
  if (typeof lat !== 'number' || typeof lng !== 'number'
    || !optionalNumber(heading) || !optionalNumber(speed) || !optionalNumber(accuracy)) {
    return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
  }
  const result = await recordConductorLocation(user.id, id, { lat, lng, heading, speed, accuracy });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 403 });
  return NextResponse.json({ ok: true, skipped: result.skipped });
}
