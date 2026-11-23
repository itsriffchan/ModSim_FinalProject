'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ExplorerShell({
  title,
  children,
  subNav,
}: {
  title: string;
  children: React.ReactNode;
  subNav?: React.ReactNode;
}) {
  const pathname = usePathname();
  const onRegion =
    pathname === '/' || pathname === '/region' || pathname.startsWith('/city/');

  return (
    <div className="flex min-h-full flex-col bg-[#d8dee6] text-slate-900">
      <header className="border-b border-slate-400/60 bg-[#2f4a5e] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">NCR scenario explorer</h1>
          <nav className="flex flex-wrap gap-1 text-sm" aria-label="Main views">
            <Link
              href="/region"
              className={`rounded px-3 py-1.5 ${onRegion ? 'bg-white/20' : 'hover:bg-white/10'}`}
              aria-current={onRegion ? 'page' : undefined}
            >
              Region
            </Link>
            <Link
              href="/compare"
              className={`rounded px-3 py-1.5 ${pathname === '/compare' ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              Compare
            </Link>
          </nav>
          <p className="ml-auto text-xs text-white/80">{title}</p>
        </div>
        {subNav ? <div className="border-t border-white/10 bg-[#263b4d] px-4 py-2">{subNav}</div> : null}
      </header>
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4">{children}</main>
    </div>
  );
}

export function ExplorerDisclaimer() {
  return (
    <p className="text-xs text-slate-600">
      Assumed timing and Kobe-transfer relationships — illustrative expectations, not earthquake forecasts.
    </p>
  );
}