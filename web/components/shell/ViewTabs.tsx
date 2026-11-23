'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useExplorerStore, type ExplorerView } from '@/lib/store/explorer-store';

const TABS: { id: ExplorerView; href: string; label: string; enabled: boolean }[] = [
  { id: 'region', href: '/region', label: 'Region', enabled: true },
  { id: 'compare', href: '/compare', label: 'Compare', enabled: true },
];

export function ViewTabs() {
  const pathname = usePathname();
  const setView = useExplorerStore((s) => s.setView);

  return (
    <nav className="explorer-view-tabs" aria-label="Primary views">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.id === 'region' && (pathname === '/' || pathname.startsWith('/city/'))) ||
          (tab.id === 'compare' && pathname === '/compare');
        if (!tab.enabled) {
          return (
            <span
              key={tab.id}
              className="explorer-tab explorer-tab-disabled"
              title="Planned in a later phase"
            >
              {tab.label}
            </span>
          );
        }
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`explorer-tab ${active ? 'explorer-tab-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}