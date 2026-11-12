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
    <div className={dark ? 'min-h-dvh bg-[#070b09] text-white' : 'min-h-dvh bg-[#e7e1d6] text-[#14241c]'}>
      <div
        className={`mx-auto flex h-dvh w-full max-w-[430px] flex-col ${
          dark ? 'bg-[#111614]' : 'bg-[#F7F5F0]'
        } md:my-4 md:h-[calc(100dvh-2rem)] md:overflow-hidden md:rounded-[32px] md:shadow-[0_30px_80px_rgba(20,36,28,0.18)]`}
      >
        <div id="main" className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </div>
        {nav}
      </div>
    </div>
  );
}

export function buttonClass(variant: 'copper' | 'green' | 'mint' | 'outline' | 'ghost' = 'copper', extra = '') {
  const base =
    'inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-5 text-[17px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60';
  const styles = {
    copper: 'bg-[#E8833A] text-white shadow-[0_10px_24px_rgba(232,131,58,0.28)]',
    green: 'bg-[#0B5D3B] text-white shadow-[0_10px_24px_rgba(11,93,59,0.2)]',
    mint: 'bg-[#1DB972] text-[#062117]',
    outline: 'border border-[#D5E0D8] bg-white text-[#0B5D3B]',
    ghost: 'h-12 text-[#5C6B63]',
  } as const;
  return `${base} ${styles[variant]} ${extra}`;
}

export function Wordmark({
  tone = 'dark',
  subtitle,
}: {
  tone?: 'dark' | 'light' | 'copper';
  subtitle?: string;
}) {
  const word = tone === 'light' ? 'text-white' : 'text-[#143028]';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8833A] text-lg font-bold text-white">T</span>
      <span className="leading-tight">
        <span className={`block text-[17px] font-semibold tracking-tight ${word}`}>Twende</span>
        {subtitle ? <span className={`block text-[11px] ${tone === 'light' ? 'text-white/70' : 'text-[#6A756E]'}`}>{subtitle}</span> : null}
      </span>
    </span>
  );
}

export function Avatar({ initials, size = 40, tone = 'green' }: { initials: string; size?: number; tone?: 'green' | 'copper' }) {
  const background = tone === 'copper' ? '#E8833A' : '#0B5D3B';
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background, fontSize: size < 48 ? 13 : 28 }}
    >
      {initials}
    </span>
  );
}
