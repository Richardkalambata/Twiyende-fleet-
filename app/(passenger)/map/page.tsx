import { MapScreen } from '@/components/tracking/map-screen';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const metadata = { title: 'Live buses' };

export default async function RiderMapPage() {
  const user = await requireUser(['passenger']);
  const ride = await (await getDb()).get<{ id: string; busId: string; endsAt: number }>(
    `SELECT id, bus_id AS "busId", created_at + 10800000 AS "endsAt"
       FROM rides WHERE passenger_id = ? AND status IN ('pending', 'verified')
         AND created_at > ? ORDER BY created_at DESC, id DESC LIMIT 1`,
    user.id, Date.now() - 3 * 60 * 60 * 1000,
  );
  return <MapScreen mode="rider" paidRide={ride} />;
}
