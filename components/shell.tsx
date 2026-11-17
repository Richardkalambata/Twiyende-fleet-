import type { ReactNode } from 'react';

export function PhoneShell({
  children,
  tone = 'light',
  nav,
}: {
  children: ReactNode;
  tone?: 'light' | 'dark';
  nav?: ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <div className={dark ? 'min-h-dvh bg-[#E8EDF5] text-white' : 'min-h-dvh bg-[#E8EDF5] text-[#0B1B3B]'}>
      <div className={`mx-auto flex h-dvh w-full max-w-[430px] flex-col ${dark ? 'bg-[#F4F6FB] text-[#0B1B3B]' : 'bg-[#F4F6FB]'} md:my-4 md:h-[calc(100dvh-2rem)] md:overflow-hidden md:rounded-[28px] md:shadow-[0_24px_60px_rgba(11,27,59,0.12)]`}>
        <div id="main" className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {nav}
      </div>
    </div>
  );
}

export function buttonClass(variant: 'copper' | 'green' | 'mint' | 'outline' | 'ghost' = 'copper', extra = '') {
  const base = 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-bold tracking-[-0.02em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
  const styles = {
    copper: 'bg-[#1F5BFF] text-white',
    green: 'bg-[#1F5BFF] text-white',
    mint: 'bg-[#12B76A] text-white',
    outline: 'bg-white text-[#0B1B3B] ring-1 ring-[#E4E8F0]',
    ghost: 'h-11 text-[#5C6578]',
  } as const;
  return `${base} ${styles[variant]} ${extra}`;
}

export function Logo({ tone = 'dark', business = false }: { tone?: 'dark' | 'light'; business?: boolean }) {
  const ink = tone === 'light' ? '#FFFFFF' : '#0B1B3B';
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden>
        <path d="M3 0h4.2L3.2 16H-1L3 0z" fill="#1F5BFF" />
        <path d="M10 0h4.2L10.2 16H6L10 0z" fill={ink} />
      </svg>
      <span className="leading-none">
        <span className="block text-[18px] font-extrabold lowercase tracking-[-0.05em]" style={{ color: ink }}>twende</span>
        {business ? <span className={`block text-[10px] font-semibold ${tone === 'light' ? 'text-white/70' : 'text-[#5C6578]'}`}>Fleet Business</span> : null}
      </span>
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
