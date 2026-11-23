'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { ExplorerProviders } from '@/components/shell/ExplorerProviders';
import { useExplorerStore } from '@/lib/store/explorer-store';

function CityRedirectBody({ pcode }: { pcode: string }) {
  const router = useRouter();
  const setLguPcode = useExplorerStore((s) => s.setLguPcode);
  const setGeographicFocus = useExplorerStore((s) => s.setGeographicFocus);
  const setView = useExplorerStore((s) => s.setView);

  useEffect(() => {
    setView('region');
    setLguPcode(pcode);
    setGeographicFocus(true);
    router.replace('/region');
  }, [pcode, router, setGeographicFocus, setLguPcode, setView]);

  return (
    <p className="text-sm text-[var(--shell-muted)] p-4" aria-live="polite">
      Opening region view…
    </p>
  );
}

/** Legacy `/city/[pcode]` URLs open Region with that LGU framed. */
export function CityRedirect({ pcode }: { pcode: string }) {
  return (
    <ExplorerProviders view="region">
      <CityRedirectBody pcode={pcode} />
    </ExplorerProviders>
  );
}