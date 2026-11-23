'use client';

import { useEffect, useState } from 'react';

import { fetchPresentationPayload } from '@/lib/payload/load';
import type { DatasetKey } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function usePayloadBootstrap(dataset: DatasetKey = 'comparison') {
  const setPayload = useExplorerStore((s) => s.setPayload);
  const payload = useExplorerStore((s) => s.payload);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!payload);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPresentationPayload(dataset)
      .then((p) => {
        if (cancelled) return;
        setPayload(p);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataset, setPayload]);

  return { loading, error, payload };
}