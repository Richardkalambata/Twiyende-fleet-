import { MapScreen } from '@/components/tracking/map-screen';

export const metadata = { title: 'Fleet map' };

export default function OperatorMapPage() {
  return <MapScreen mode="operator" />;
}
