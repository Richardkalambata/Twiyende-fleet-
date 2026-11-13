'use client';

import { animate, motion, useMotionValue } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const SLIDES = [
  {
    src: '/onboarding/topup.webp',
    alt: 'A hand holding a phone wallet with mobile-money coins',
    title: 'Top up with mobile money',
    body: 'Add kwacha from MTN, Airtel, or Zamtel. The fare never needs cash on the bus.',
    tint: '#E7F3EC',
  },
  {
    src: '/onboarding/board.webp',
    alt: 'A rider stepping onto a green and cream minibus',
    title: 'Board any Twende minibus',
    body: 'Enter the bus number on the door. The fare for that route is already set.',
    tint: '#F3EFE7',
  },
  {
    src: '/onboarding/code.webp',
    alt: 'A phone showing a one-time fare code',
    title: 'Show a one-time code',
    body: 'Your phone makes a short code. The conductor confirms it and the ride is paid.',
    tint: '#E8F6EF',
  },
  {
    src: '/onboarding/lost.webp',
    alt: 'A phone found on a minibus seat',
    title: 'Lost something?',
    body: 'Report it with a photo. When the conductor logs it, you get a pickup code.',
    tint: '#FFF1E6',
  },
] as const;

export function Onboarding() {
  const [index, setIndex] = useState(0);
  const dragX = useMotionValue(0);
  const last = index === SLIDES.length - 1;

  function go(next: number) {
    const value = Math.max(0, Math.min(SLIDES.length - 1, next));
    setIndex(value);
    animate(dragX, 0, { duration: 0.2 });
  }

  return (
    <main className="min-h-dvh bg-[#F7F5F0] text-[#0F1A14] md:grid md:place-items-center md:bg-[#EFEAE2] md:p-6">
      <section className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#F7F5F0] md:min-h-[844px] md:overflow-hidden md:rounded-[36px] md:shadow-[0_1px_2px_rgba(7,61,39,0.06),0_24px_64px_rgba(7,61,39,0.12)]">
        <div className="flex items-center justify-between px-5 pt-[max(20px,env(safe-area-inset-top))]">
          <span className="text-[14px] font-semibold text-[#0B5D3B]">Twende</span>
          <Link href="/welcome" className="text-[14px] font-semibold text-[#6B7570]">Skip</Link>
        </div>
        <motion.div
          className="mt-4 overflow-hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          style={{ x: dragX }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -48) go(index + 1);
            else if (info.offset.x > 48) go(index - 1);
            else animate(dragX, 0, { duration: 0.2 });
          }}
        >
          <motion.div className="flex" animate={{ x: `${-index * 100}%` }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            {SLIDES.map((slide) => (
              <div key={slide.src} className="w-full shrink-0 px-5">
                <div className="relative aspect-[5/4] overflow-hidden rounded-[24px]" style={{ background: slide.tint }}>
                  <motion.div className="absolute inset-0" style={{ x: dragX }} transition={{ duration: 0.2 }}>
                    <Image src={slide.src} alt={slide.alt} fill priority sizes="390px" className="object-contain p-3" />
                  </motion.div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
        <div className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6">
          <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.02em]">{SLIDES[index].title}</h1>
          <p className="mt-3 text-[16px] leading-6 text-[#6B7570]">{SLIDES[index].body}</p>
          <div className="mt-auto pt-8">
            <div className="mb-5 flex gap-1.5" aria-label="Progress">
              {SLIDES.map((slide, dot) => (
                <motion.span
                  key={slide.src}
                  className="h-2 rounded-full"
                  animate={{ width: dot === index ? 22 : 8, backgroundColor: dot === index ? '#0B5D3B' : '#D9D1C5' }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
            {last ? (
              <Link href="/welcome" className="flex h-14 w-full items-center justify-center rounded-full bg-[#0B5D3B] text-[16px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(7,61,39,0.18)] active:scale-[0.98]">Get started</Link>
            ) : (
              <button type="button" onClick={() => go(index + 1)} className="flex h-14 w-full items-center justify-center rounded-full bg-[#0B5D3B] text-[16px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(7,61,39,0.18)] active:scale-[0.98]">Next</button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
