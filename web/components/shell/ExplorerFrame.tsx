'use client';

import type { ReactNode } from 'react';

import { DisclaimerStrip } from '@/components/panels/DisclaimerStrip';
import { AppHeader } from '@/components/shell/AppHeader';
import { useExplorerContext } from '@/components/shell/ExplorerProviders';
import { ViewTabs } from '@/components/shell/ViewTabs';

export function ExplorerFrame({
  toolbar,
  children,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  const { loading, error } = useExplorerContext();

  return (
    <div className="explorer-shell flex flex-col min-h-full flex-1">
      <DisclaimerStrip />
      <AppHeader />
      <ViewTabs />
      {toolbar ? <div className="explorer-toolbar">{toolbar}</div> : null}
      {error ? (
        <div className="explorer-error-banner" role="alert">
          {error}
        </div>
      ) : null}
      <main className="explorer-main flex-1">{children}</main>
      {loading ? (
        <p className="text-sm text-[var(--shell-muted)] mt-2" aria-live="polite">
          Loading saved presentation payload…
        </p>
      ) : null}
    </div>
  );
}
