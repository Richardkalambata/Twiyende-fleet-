import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-[#E8833A]">Twende</p>
      <h1 className="mt-2 text-3xl font-semibold">That page is not on this route</h1>
      <p className="mt-2 text-[#5C6B63]">Head back to sign in and pick up your trip.</p>
      <Link href="/" className="mt-6 inline-flex h-14 items-center rounded-full bg-[#0B5D3B] px-8 font-semibold text-white">
        Go to Twende
      </Link>
    </main>
  );
}
