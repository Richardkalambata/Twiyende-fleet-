'use client';

import { useEffect, useState } from 'react';
import { BusFront, CircleHelp, UsersRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/shell';

export function SiteHeader({ business = false }: { business?: boolean }) {
  const [helpActive, setHelpActive] = useState(false);
  useEffect(() => {
    const sync = () => setHelpActive(window.location.hash === '#faq');
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, [business]);

  const links = [
    { href: '/', label: 'Riders', Icon: UsersRound, active: !business && !helpActive },
    { href: '/business', label: 'Business', Icon: BusFront, active: business && !helpActive },
    { href: business ? '/business#faq' : '/#faq', label: 'Help', Icon: CircleHelp, active: helpActive },
  ];
  const renderLinks = (mobile = false, items = links) => items.map(({ href, label, Icon, active }) => (
    <Link key={label} href={href}
      onClick={(event) => {
        setHelpActive(label === 'Help');
        event.currentTarget.closest('details')?.removeAttribute('open');
      }}
      aria-current={active ? (label === 'Help' ? 'location' : 'page') : undefined}
      className={`flex min-h-11 items-center gap-2 rounded-xl px-3 transition-colors ${mobile
        ? 'hover:text-[#1747CB]' : 'hover:text-white'} ${active
        ? mobile ? 'text-[#1747CB]' : 'text-white'
        : ''}`}>
      <Icon className="size-6 shrink-0" aria-hidden />
      <span className={active ? 'underline decoration-2 decoration-[#4D82FF] underline-offset-8' : undefined}>{label}</span>
    </Link>
  ));

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:h-20 md:px-8">
        <Link href={business ? '/business' : '/'} aria-label={business ? 'Twende Fleet home' : 'Twende home'}><Logo tone="light" business={business} /></Link>
        <nav className="hidden items-center gap-1 text-[15px] font-semibold text-[#D5DCEC] md:flex" aria-label="Site">
          {renderLinks()}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={business ? '/business/login' : '/login'} className="hidden h-10 items-center rounded-xl px-3 text-[14px] font-bold text-white sm:inline-flex">Sign in</Link>
          <Link href={business ? '/business/signup' : '/signup'} className="inline-flex h-12 items-center rounded-xl bg-[#1F5BFF] px-3 text-[13px] font-bold text-white sm:px-5 sm:text-[14px]">{business ? 'Create a company' : 'Create account'}</Link>
          <details className="relative md:hidden">
            <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl bg-[#0B1B3B] text-white" aria-label="Open site menu">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
            </summary>
            <nav aria-label="Mobile site" className="absolute right-0 top-full mt-2 grid w-48 gap-1 rounded-xl bg-white p-2 text-sm font-semibold text-[#0B1B3B] shadow-xl [&>a]:rounded-lg [&>a]:p-2">
              {renderLinks(true, business ? links.slice(0, -1) : links)}
              <Link href={business ? '/business/login' : '/login'}>{business ? 'Operator sign in' : 'Sign in'}</Link>
              {business && <Link href="/business/conductor/login">Conductor sign in</Link>}
              {business && renderLinks(true, links.slice(-1))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function CreatorCredit() {
  return (
    <a href="https://modernmindsettechnologies.com/" className="inline-flex items-center justify-center gap-2 text-[11px] font-semibold leading-tight text-[#5C6578] hover:underline">
            <span>Built by</span>
            <Image src="/images/modernmindset-logo.webp" alt="ModernMindSet Technologies" width={520} height={101} className="h-auto w-24 shrink-0 md:w-28" />
          </a>
  );
}

export function SiteFooter({ business = false }: { business?: boolean }) {
  return (
    <footer className="border-t border-[#E4E8F0] bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <Logo business={business} />
          <p className="mt-3 max-w-xs text-[14px] leading-6 text-[#3E4A63]">Cashless minibus fares for Lusaka.</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-[14px] font-semibold text-[#0B1B3B]" aria-label="Footer">
          <Link href="/">Riders</Link>
          <Link href="/business">Business</Link>
          <Link href={business ? '/business#faq' : '/#faq'}>Help</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
      <div className="border-t border-[#E4E8F0]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 text-[12px] font-semibold text-[#5C6578] md:px-8">
          <p>© 2026 Twende.</p>
          <div className="hidden md:block"><CreatorCredit /></div>
        </div>
      </div>
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
