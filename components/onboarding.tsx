'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Wordmark } from './shell';

const STEPS = [
  {
    src: '/onboarding/topup.webp',
    alt: 'A hand holding a phone wallet with mobile-money coins',
    title: 'Top up',
    body: 'Add kwacha from your phone.',
  },
  {
    src: '/onboarding/board.webp',
    alt: 'A rider stepping onto a green and cream minibus',
    title: 'Board any Twende bus',
    body: 'Enter the number on the door.',
  },
  {
    src: '/onboarding/code.webp',
    alt: 'A phone showing a one-time fare code',
    title: 'Show your 4-letter code',
    body: 'The conductor confirms it once.',
  },
  {
    src: '/onboarding/lost.webp',
    alt: 'A phone found on a minibus seat',
    title: "Lost something? We'll help.",
    body: 'Report it and track the pickup.',
  },
] as const;

export function Onboarding() {
  const reduce = useReducedMotion();
  return (
    <main className="min-h-dvh bg-[#EFEAE2] text-[#0F1A14] md:grid md:place-items-center md:p-6">
      <section className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[#F7F5F0] md:min-h-[844px] md:overflow-hidden md:rounded-[36px] md:shadow-[0_1px_2px_rgba(7,61,39,0.06),0_24px_64px_rgba(7,61,39,0.12)]">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <div className="safe-top">
            <Wordmark />
          </div>
          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.02em]">Ride without cash.</h1>
              <p className="mt-2 text-[15px] leading-5 text-[#3E4A44]">Top up once. Pay any Twende bus. Keep the receipt.</p>
            </div>
            <div className="relative h-[132px] w-[124px] shrink-0">
              <Image
                src="/onboarding/board.webp"
                alt="A rider boarding a Twende minibus"
                fill
                priority
                sizes="148px"
                className="object-contain object-bottom"
              />
            </div>
          </div>
          <h2 className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#3E4A44]">How it works</h2>
          <ol className="space-y-2">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.22, delay: reduce ? 0 : 0.05 * index, ease: 'easeOut' }}
              >
                <article className="flex overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgba(7,61,39,0.06),0_8px_24px_rgba(7,61,39,0.08)]">
                  <div className="relative h-[76px] w-[80px] shrink-0">
                    <Image src={step.src} alt={step.alt} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center px-3">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center self-start rounded-full bg-[#E7F3EC] text-[11px] font-semibold text-[#0B5D3B]">{index + 1}</span>
                    <h3 className="mt-1 text-[16px] font-semibold leading-5 tracking-[-0.02em]">{step.title}</h3>
                    <p className="mt-0.5 text-[14px] leading-5 text-[#3E4A44]">{step.body}</p>
                  </div>
                </article>
              </motion.li>
            ))}
          </ol>
        </div>
        <div className="sticky bottom-0 z-10 bg-[#F7F5F0]/85 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="space-y-2">
            <Link href="/signup" className="flex h-14 items-center justify-center rounded-full bg-[#0B5D3B] text-[16px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_rgba(7,61,39,0.18)]">Create account</Link>
            <Link href="/login" className="flex h-14 items-center justify-center rounded-full bg-white text-[16px] font-semibold text-[#0F1A14] shadow-[0_1px_2px_rgba(7,61,39,0.06),0_8px_24px_rgba(7,61,39,0.08)]">I already have an account</Link>
            <Link href="/business" className="block py-1 text-center text-[13px] font-medium text-[#3E4A44]">I run a fleet</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
