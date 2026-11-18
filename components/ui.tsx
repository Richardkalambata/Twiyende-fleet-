import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'copper' | 'ghost' }) {
  const styles = {
    primary: 'bg-[#1F5BFF] text-white',
    copper: 'bg-[#1F5BFF] text-white',
    ghost: 'bg-white text-[#0F1A14] shadow-[inset_0_0_0_1px_rgba(15,26,20,0.08)]',
  }[variant];
  return (
    <button
      className={`inline-flex h-14 w-full items-center justify-center gap-2 rounded-full px-5 text-[16px] font-semibold transition duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-[#6B7570]">{label}</span>
      <input className="field" {...props} />
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white shadow-card ${className}`}>{children}</section>;
}

export function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'copper' | 'muted' }) {
  const styles = {
    green: 'bg-[#E8F8EF] text-[#128A4E]',
    copper: 'bg-[#FFF6E8] text-[#C47B12]',
    muted: 'bg-[#F1EEE8] text-[#6B7570]',
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles}`}>{children}</span>;
}

export function ListRow({
  icon,
  title,
  meta,
  amount,
  trailing,
}: {
  icon: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  amount?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EEF3FF] text-[#1F5BFF]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[15px] font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-[#6B7570]">{meta}</span>
      </span>
      {amount ? <span className="num text-right text-[15px] font-semibold">{amount}</span> : null}
      {trailing}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  spark,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  spark?: number[];
}) {
  const up = detail.startsWith('↑');
  const down = detail.startsWith('↓');
  const max = Math.max(...(spark ?? [1]), 1);
  const points = (spark ?? []).map((value, index, all) => {
    const x = all.length === 1 ? 0 : (index / (all.length - 1)) * 72;
    const y = 22 - (value / max) * 18;
    return `${x},${y}`;
  }).join(' ');
  return (
    <article className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg text-[#0B1B3B] ring-1 ring-[#D5DCE8]">{icon}</span>
        {spark && spark.length > 1 ? (
          <svg viewBox="0 0 72 24" className="h-6 w-[72px]" aria-hidden>
            <polyline fill="none" stroke="#1F5BFF" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" points={points} />
          </svg>
        ) : null}
      </div>
      <p className="mt-3 text-[13px] text-[#6B7570]">{label}</p>
      <p className="num mt-1 text-[24px] font-semibold tracking-tight text-[#0F1A14]">{value}</p>
      <p className={`mt-1 text-[13px] ${up ? 'text-[#128A4E]' : down ? 'text-[#C53434]' : 'text-[#5C6578]'}`}>{detail}</p>
    </article>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-card">
      <svg viewBox="0 0 80 48" className="mx-auto h-12 w-20 text-[#1F5BFF]" aria-hidden>
        <rect x="6" y="14" width="52" height="22" rx="6" fill="#E7EEFF" />
        <path d="M58 22h10l6 8v6H58V22z" fill="#0B1B3B" />
        <circle cx="22" cy="38" r="5" fill="#0B1B3B" />
        <circle cx="58" cy="38" r="5" fill="#0B1B3B" />
        <rect x="14" y="20" width="16" height="8" rx="2" fill="#1F5BFF" />
      </svg>
      <p className="mt-3 text-[16px] font-semibold">{title}</p>
      <p className="mt-1 text-[14px] leading-5 text-[#6B7570]">{body}</p>
    </div>
  );
}

export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full bg-[#0B1B3B] font-semibold text-white"
      style={{ width: size, height: size, fontSize: size < 36 ? 11 : 13 }}
    >
      {initials.slice(0, 2)}
    </span>
  );
}
