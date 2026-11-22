import type { ReactNode } from 'react';

export function PhoneShell({
  children,
  tone = 'light',
  nav,
  business = false,
}: {
  children: ReactNode;
  tone?: 'light' | 'dark' | 'navy';
  nav?: ReactNode;
  business?: boolean;
}) {
  const navy = tone === 'navy';
  return (
    <div data-workspace={nav ? "true" : undefined} className={`twende-shell flex h-dvh w-full flex-col ${nav ? 'lg:flex-row' : ''} ${navy ? 'bg-[#071433] text-white' : 'bg-[#F4F6FB] text-[#0B1B3B]'} print:!h-auto`}>
      {nav ? (
        <header className="shrink-0 border-b border-white/10 bg-[#0B1B3B] px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))] print:hidden lg:hidden">
          <Logo tone="light" business={business} />
        </header>
      ) : null}
      <main id="main" className="min-h-0 min-w-0 flex-1 overflow-y-auto print:overflow-visible">
        {nav ? children : <div className="mx-auto w-full max-w-3xl md:px-6">{children}</div>}
      </main>
      {nav ? <div className="shrink-0 print:hidden md:order-first lg:w-56 lg:border-r lg:border-[#E4E8F0] lg:bg-[#0B1B3B]">{nav}</div> : null}
    </div>
  );
}

export function buttonClass(variant: 'copper' | 'green' | 'mint' | 'outline' | 'ghost' = 'copper', extra = '') {
  const base = 'press inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-bold tracking-[-0.02em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
  const styles = {
    copper: 'bg-[#1F5BFF] text-white',
    green: 'bg-[#1F5BFF] text-white',
    mint: 'bg-[#0E7A45] text-white',
    outline: 'bg-white text-[#0B1B3B] ring-1 ring-[#E4E8F0]',
    ghost: 'h-11 text-[#5C6578]',
  } as const;
  return `${base} ${styles[variant]} ${extra}`;
}

export function Logo({ tone = 'dark', business = false }: { tone?: 'dark' | 'light'; business?: boolean }) {
  const light = tone === 'light';
  return (
    <span className="inline-flex flex-col items-start">
      <svg className="block h-7 w-auto shrink-0" viewBox="0 0 372 102" role="img" aria-label="Twende">
        <use href="/images/twende-d.svg#wordmark" fill={light ? '#FFFFFF' : '#081A3F'} />
      </svg>
      {business ? <span className={`mt-0.5 block text-[10px] font-semibold leading-none ${light ? 'text-white/75' : 'text-[#5C6578]'}`}>Fleet</span> : null}
    </span>
  );
}

export function Wordmark({ tone = 'dark', subtitle }: { tone?: 'dark' | 'light' | 'copper'; subtitle?: string }) {
  return <Logo tone={tone === 'light' ? 'light' : 'dark'} business={Boolean(subtitle)} />;
}

export function Avatar({ initials, size = 40 }: { initials: string; size?: number; tone?: 'green' | 'copper' }) {
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full bg-[#0B1B3B] font-bold text-white" style={{ width: size, height: size, fontSize: size < 48 ? 12 : 18 }}>
      {initials.slice(0, 2)}
    </span>
  );
}
