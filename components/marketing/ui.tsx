'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setShown(true);
    }, { threshold: 0.16 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${className} ${shown ? 'land-in' : 'land-wait'}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <div className="divide-y divide-[#E4E8F0] overflow-hidden rounded-[20px] bg-white">
      {items.map((item, index) => {
        const on = open === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-bold"
              aria-expanded={on}
              aria-controls={`${base}-${index}`}
              onClick={() => setOpen(on ? -1 : index)}
            >
              {item.q}
              <span className="text-[20px] font-medium text-[#1F5BFF]">{on ? '–' : '+'}</span>
            </button>
            {on ? <p id={`${base}-${index}`} className="px-5 pb-4 text-[15px] leading-6 text-[#3E4A63]">{item.a}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export function StickyBar({ primary, secondary }: { primary: { href: string; label: string }; secondary: { href: string; label: string } }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const target = document.getElementById('hero-ctas');
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setShow(!entry?.isIntersecting), { threshold: 0.15 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E4E8F0] bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-[420px] gap-2">
        <Link href={secondary.href} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#F4F6FB] text-[14px] font-bold text-[#0B1B3B]">{secondary.label}</Link>
        <Link href={primary.href} className="flex h-12 flex-[1.4] items-center justify-center rounded-xl bg-[#1F5BFF] text-[14px] font-bold text-white">{primary.label}</Link>
      </div>
    </div>
  );
}
