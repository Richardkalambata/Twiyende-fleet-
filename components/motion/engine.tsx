'use client';

import { Logo } from '@/components/shell';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { formatBalance } from '@/lib/money';

export function richMotion() {
  return typeof document !== 'undefined' && document.documentElement.dataset.motion === 'rich';
}

export function MotionEngine() {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const cores = navigator.hardwareConcurrency || 8;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      const low = cores <= 4 || (typeof memory === 'number' && memory <= 2);
      root.dataset.motion = !reduced && !low ? 'rich' : 'simple';
    };
    apply();
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', apply);

    let frame = 0;
    const paint = () => {
      frame = 0;
      if (root.dataset.motion !== 'rich') return;
      document.querySelectorAll<HTMLElement>('[data-depth]').forEach((node) => {
        const rect = node.getBoundingClientRect();
        const mid = rect.top + rect.height / 2 - window.innerHeight / 2;
        const spin = Math.max(-1, Math.min(1, -mid / window.innerHeight));
        node.style.setProperty('--spin', spin.toFixed(3));
      });
      document.querySelectorAll<HTMLElement>('[data-hero]').forEach((node) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--scroll', Math.max(0, Math.min(1, -rect.top / window.innerHeight)).toFixed(3));
      });
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    const onPointer = (event: PointerEvent) => {
      if (root.dataset.motion !== 'rich') return;
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((node) => {
        const rect = node.getBoundingClientRect();
        const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
        if (!inside) {
          node.style.transform = '';
          return;
        }
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        const ry = Math.max(-6, Math.min(6, px * 12));
        const rx = Math.max(-6, Math.min(6, -py * 12));
        node.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        node.style.setProperty('--px', px.toFixed(3));
      });
      document.querySelectorAll<HTMLElement>('[data-hero]').forEach((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        node.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
        node.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
      });
    };
    const reset = () => {
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((node) => {
        node.style.transform = '';
      });
    };
    const onOrient = (event: DeviceOrientationEvent) => {
      if (root.dataset.motion !== 'rich') return;
      const ry = Math.max(-6, Math.min(6, (event.gamma ?? 0) / 6));
      const rx = Math.max(-6, Math.min(6, ((event.beta ?? 40) - 40) / 8));
      document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((node) => {
        if (node.matches(':hover')) return;
        node.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerleave', reset);
    window.addEventListener('deviceorientation', onOrient);
    paint();
    return () => {
      media.removeEventListener('change', apply);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerleave', reset);
      window.removeEventListener('deviceorientation', onOrient);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}

export function RouteShift({ children }: { children: ReactNode }) {
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if ('startViewTransition' in document) return;
    const node = ref.current;
    if (!node) return;
    node.classList.remove('route-enter');
    void node.offsetWidth;
    node.classList.add('route-enter');
  }, [path]);
  const showBrand = path === '/' || path === '/business' || path === '/home'
    || path === '/login' || path === '/business/login' || path === '/business/conductor/login';
  return (
    <>
      {showBrand && (
        <div key={path} className="brand-entry" aria-hidden="true">
          <Logo tone="light" business={path.startsWith('/business')} />
        </div>
      )}
      <div ref={ref}>{children}</div>
    </>
  );
}

export function CountUp({ ngwee }: { ngwee: number }) {
  const [shown, setShown] = useState(ngwee);
  useEffect(() => {
    if (!richMotion()) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 720);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(ngwee * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setShown(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ngwee]);
  return <>{formatBalance(shown)}</>;
}
