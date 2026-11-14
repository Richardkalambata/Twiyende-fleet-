export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 px-6 py-5">
      <div className="h-10 w-64 rounded-full bg-[#e4ddd2]" />
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="h-28 rounded-3xl bg-white" />
        <div className="h-28 rounded-3xl bg-white" />
        <div className="h-28 rounded-3xl bg-white" />
        <div className="h-28 rounded-3xl bg-white" />
      </div>
      <div className="h-72 rounded-[28px] bg-white" />
    </div>
  );
}
