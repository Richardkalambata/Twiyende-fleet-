import { MapScreen } from '@/components/tracking/map-screen';

export const metadata = { title: 'Live buses' };

export default function RiderMapPage() {
  return (
    <div>
      <header className="safe-top px-5">
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#1F5BFF]">Lusaka</p>
        <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">Buses on the move</h1>
      </header>
      <MapScreen mode="rider" />
    </div>
  );
}
