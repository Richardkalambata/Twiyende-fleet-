import { MapScreen } from '@/components/tracking/map-screen';

export const metadata = { title: 'Live buses' };

export default function RiderMapPage() {
  return <MapScreen mode="rider" />;
}
