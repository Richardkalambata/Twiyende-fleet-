import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { trailFor } from '@/lib/tracking';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser('operator');
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  if (user.role !== 'operator') return NextResponse.json({ error: 'Operators only' }, { status: 403 });
  const { id } = await context.params;
  const points = await trailFor(user.id, id);
  return NextResponse.json({ points });
}
