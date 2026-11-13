'use client';

import { useState } from 'react';
import Link from 'next/link';

const SLIDES = [
  {
    title: 'Top up with mobile money',
    body: 'Add kwacha from MTN, Airtel, or Zamtel. The fare never needs cash on the bus.',
    art: 'wallet',
  },
  {
    title: 'Board any Twende minibus',
    body: 'Enter the bus number on the door. The fare for that route is already set.',
    art: 'bus',
  },
  {
    title: 'Show a one-time code',
    body: 'Your phone makes a short code. The conductor confirms it and the ride is paid.',
    art: 'code',
  },
  {
    title: 'Lost something?',
    body: 'Report it with a photo. When the conductor logs it, you get a pickup code.',
    art: 'found',
  },
] as const;

export function Onboarding() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;
  return (
    <main className="min-h-dvh bg-[#EFEAE3] md:grid md:place-items-center md:p-6">
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#F7F5F0] md:min-h-[844px] md:overflow-hidden md:rounded-[36px] md:shadow-[0_30px_80px_rgba(20,36,28,0.16)]">
        <div className="flex items-center justify-between px-5 pt-6">
          <span className="text-sm font-semibold text-[#0B5D3B]">Twende</span>
          <Link href="/welcome" className="text-sm font-semibold text-[#6A756E]">Skip</Link>
        </div>
        <div className="flex flex-1 flex-col px-6 pb-8 pt-4">
          <div className="grid flex-1 place-items-center">
            <Art kind={slide.art} />
          </div>
          <h1 className="mt-6 text-[32px] font-semibold leading-tight tracking-tight text-[#14241C]">{slide.title}</h1>
          <p className="mt-3 text-base leading-6 text-[#5C6B63]">{slide.body}</p>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2" aria-label="Progress">
              {SLIDES.map((item, dot) => (
                <span key={item.title} className={`h-2 rounded-full ${dot === index ? 'w-6 bg-[#0B5D3B]' : 'w-2 bg-[#D9D1C5]'}`} />
              ))}
            </div>
            {last ? (
              <Link href="/welcome" className="inline-flex h-14 items-center rounded-full bg-[#0B5D3B] px-6 text-base font-semibold text-white">Get started</Link>
            ) : (
              <button type="button" onClick={() => setIndex((value) => value + 1)} className="inline-flex h-14 items-center rounded-full bg-[#0B5D3B] px-6 text-base font-semibold text-white">Next</button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Art({ kind }: { kind: string }) {
  if (kind === 'wallet') {
    return (
      <svg viewBox="0 0 280 220" className="h-56 w-full" aria-hidden>
        <rect x="36" y="48" width="208" height="128" rx="28" fill="#0B5D3B" />
        <path d="M36 96h208" stroke="#E8B860" strokeOpacity="0.5" />
        <circle cx="196" cy="132" r="18" fill="#E8833A" />
        <text x="56" y="84" fill="white" fontSize="14" fontFamily="Inter, sans-serif">MTN · Airtel · Zamtel</text>
        <text x="56" y="150" fill="white" fontSize="28" fontFamily="Inter, sans-serif">K 120</text>
      </svg>
    );
  }
  if (kind === 'bus') {
    return (
      <svg viewBox="0 0 280 220" className="h-56 w-full" aria-hidden>
        <rect x="48" y="58" width="184" height="92" rx="22" fill="#0B5D3B" />
        <rect x="66" y="74" width="40" height="28" rx="6" fill="#F7F5F0" />
        <rect x="116" y="74" width="40" height="28" rx="6" fill="#F7F5F0" />
        <rect x="166" y="74" width="40" height="28" rx="6" fill="#F7F5F0" />
        <circle cx="92" cy="158" r="14" fill="#14241C" />
        <circle cx="188" cy="158" r="14" fill="#14241C" />
        <rect x="118" y="118" width="44" height="22" rx="8" fill="#E8833A" />
        <text x="126" y="134" fill="white" fontSize="12" fontFamily="Inter, sans-serif">12</text>
      </svg>
    );
  }
  if (kind === 'code') {
    return (
      <svg viewBox="0 0 280 220" className="h-56 w-full" aria-hidden>
        <rect x="50" y="40" width="180" height="140" rx="24" fill="white" stroke="#E7E1D6" />
        <text x="78" y="118" fill="#0B5D3B" fontSize="42" fontFamily="Inter, sans-serif" fontWeight="700">A7K3</text>
        <text x="86" y="150" fill="#6A756E" fontSize="12" fontFamily="Inter, sans-serif">Show the conductor</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 280 220" className="h-56 w-full" aria-hidden>
      <rect x="78" y="36" width="124" height="148" rx="22" fill="#14241C" />
      <rect x="90" y="52" width="100" height="116" rx="12" fill="#1B6B48" />
      <circle cx="140" cy="110" r="22" fill="#E8833A" />
      <path d="M132 110l6 6 12-14" stroke="white" strokeWidth="3" fill="none" />
    </svg>
  );
}
