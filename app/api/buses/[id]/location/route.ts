import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { recordConductorLocation } from '@/lib/tracking';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  if (user.role !== 'conductor') return NextResponse.json({ error: 'Conductors only' }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { lat?: number; lng?: number; heading?: number; speed?: number; accuracy?: number } | null;
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const result = await recordConductorLocation(user.id, id, {
    lat: Number(body.lat),
    lng: Number(body.lng),
    heading: body.heading ?? null,
    speed: body.speed ?? null,
    accuracy: body.accuracy ?? null,
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 403 });
  return NextResponse.json({ ok: true, skipped: result.skipped });
}
