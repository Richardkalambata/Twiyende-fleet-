'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';

export function Still({ src, blur, alt, className = '' }: { src: string; blur: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const skip = window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches;
    if (skip) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const shift = (rect.top - window.innerHeight / 2) * 0.05;
        node.style.transform = `translate3d(0, ${shift}px, 0)`;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return (
    <div className={`overflow-hidden rounded-[24px] shadow-[0_24px_60px_rgba(11,27,59,0.16)] ${className}`}>
      <div ref={ref} className="scale-[1.08]">
        <Image src={src} alt={alt} width={1600} height={1000} quality={88} placeholder="blur" blurDataURL={blur} sizes="(min-width: 768px) 46vw, 100vw" className="aspect-[4/3] h-auto w-full object-cover" />
      </div>
    </div>
  );
}

export function StepRail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setOn(true);
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative">
      <div className="pointer-events-none absolute left-8 right-8 top-7 hidden h-px bg-[#E4E8F0] md:block" aria-hidden>
        <div className={`h-full origin-left bg-[#1F5BFF] transition-transform duration-1000 ease-out ${on ? 'scale-x-100' : 'scale-x-0'}`} />
      </div>
      {children}
    </div>
  );
}
