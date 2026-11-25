import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    await (await getDb()).get('SELECT 1 FROM sessions LIMIT 1');
    return Response.json({ ready: true }, { headers });
  } catch {
    return Response.json({ ready: false }, { status: 503, headers });
  }
}
