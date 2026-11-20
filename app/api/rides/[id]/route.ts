import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getReceipt } from '@/lib/service';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const { id } = await context.params;
  const receipt = await getReceipt(user.id, id);
  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ status: receipt.status, verifiedAt: receipt.verifiedAt });
}
