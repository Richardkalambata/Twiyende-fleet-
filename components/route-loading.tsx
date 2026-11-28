export default function RouteLoading() {
  return (
    <div role="status" className="space-y-3 px-5 py-6 motion-safe:animate-pulse">
      <span className="sr-only">Loading page…</span>
      <div className="h-8 w-40 rounded-lg bg-[#E4EAF5]" />
      <div className="h-28 rounded-2xl bg-white" />
      <div className="h-20 rounded-2xl bg-white" />
    </div>
  );
}
