import { MapScreen } from '@/components/tracking/map-screen';

export const metadata = { title: 'Fleet map' };

export default function OperatorMapPage() {
  return (
    <div className="px-4 py-4 text-[#0B1B3B] md:px-6">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">Fleet map</h1>
      <p className="text-[14px] text-[#5C6578]">On shift, idle, and stale buses.</p>
      <div className="mt-3 overflow-hidden rounded-[24px] bg-white">
        <MapScreen mode="operator" />
      </div>
    </div>
  );
}
