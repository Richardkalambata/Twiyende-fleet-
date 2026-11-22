import { Logo } from './shell';

export function BrandLoading({ business = false }: { business?: boolean }) {
  return (
    <div role="status" aria-label={business ? 'Loading Twende Fleet' : 'Loading Twende'} className="grid min-h-dvh place-items-center bg-[#0B1B3B]">
      <div className="flex flex-col items-center gap-5">
        <Logo tone="light" business={business} />
        <span aria-hidden className="size-5 rounded-full border-2 border-white/25 border-t-[#759AFF] motion-safe:animate-spin" />
      </div>
    </div>
  );
}
