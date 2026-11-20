import Link from 'next/link';
import { Logo } from '@/components/shell';

export function SiteHeader({ business = false }: { business?: boolean }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:h-20 md:px-8">
        <Link href={business ? '/business' : '/'} aria-label="Twende home"><Logo tone="light" business={business} /></Link>
        <nav className="hidden items-center gap-6 text-[14px] font-semibold text-[#D5DCEC] md:flex" aria-label="Site">
          <Link href="/">Riders</Link>
          <Link href="/business">Business</Link>
          <Link href={business ? '/business#faq' : '/#faq'}>Help</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href={business ? '/business/login' : '/login'} className="hidden h-10 items-center rounded-xl px-3 text-[14px] font-bold text-white sm:inline-flex">Sign in</Link>
          <Link href={business ? '/business/signup' : '/signup'} className="inline-flex h-12 items-center rounded-xl bg-[#1F5BFF] px-3 text-[13px] font-bold text-white sm:px-5 sm:text-[14px]">{business ? 'Create a company' : 'Create account'}</Link>
          <details className="relative md:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl bg-[#0B1B3B] text-white" aria-label="Open site menu">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
            </summary>
            <nav aria-label="Mobile site" className="absolute right-0 top-full mt-2 grid w-48 gap-1 rounded-xl bg-white p-2 text-sm font-semibold text-[#0B1B3B] shadow-xl [&>a]:rounded-lg [&>a]:p-2">
              <Link href="/">Riders</Link>
              <Link href="/business">Business</Link>
              <Link href={business ? '/business#faq' : '/#faq'}>Help</Link>
              <Link href={business ? '/business/login' : '/login'}>Sign in</Link>
              {business && <Link href="/business/conductor/login">Conductor sign in</Link>}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ business = false }: { business?: boolean }) {
  return (
    <footer className="border-t border-[#E4E8F0] bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-[14px] leading-6 text-[#3E4A63]">Cashless minibus fares for Lusaka. Made in Lusaka.</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-[14px] font-semibold text-[#0B1B3B]" aria-label="Footer">
          <Link href="/">Riders</Link>
          <Link href="/business">Business</Link>
          <Link href={business ? '/business#faq' : '/#faq'}>Help</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
      <p className="border-t border-[#E4E8F0] py-4 text-center text-[12px] font-semibold text-[#5C6578]">© 2026 Twende. Made in Lusaka.</p>
    </footer>
  );
}

export function CtaBand({ title, body, href, label }: { title: string; body: string; href: string; label: string }) {
  return (
    <section className="bg-[#071230] text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-4 px-5 py-16 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <h2 className="max-w-xl text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] md:text-[40px]">{title}</h2>
          <p className="mt-3 max-w-lg text-[16px] leading-6 text-[#D5DCEC]">{body}</p>
        </div>
        <Link href={href} className="inline-flex h-12 items-center rounded-xl bg-[#1F5BFF] px-5 text-[15px] font-bold text-white">{label}</Link>
      </div>
    </section>
  );
}
