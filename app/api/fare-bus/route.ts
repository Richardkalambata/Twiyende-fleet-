import { getCurrentUser } from '@/lib/auth';
import { getFareBusOption } from '@/lib/service';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const number = new URL(request.url).searchParams.get('number') ?? '';
  if (!/^\d{1,4}$/.test(number)) return Response.json({ bus: null }, { status: 400, headers });
  if ((await getCurrentUser('passenger'))?.role !== 'passenger') return Response.json({ bus: null }, { status: 401, headers });
  return Response.json({ bus: await getFareBusOption(number) }, { headers });
}
