'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { displayState } from '@/lib/display/state';
import { fetchPresentationPayload, normalizeScenarios } from '@/lib/payload/load';
import type { DatasetKey, ScenarioViewId } from '@/lib/payload/types';
import type { ModsimExplorer } from '@/lib/test-adapter';
import { useExplorerStore } from '@/lib/store/explorer-store';

interface ExplorerContextValue {
  loading: boolean;
  error: string | null;
}

const ExplorerContext = createContext<ExplorerContextValue>({
  loading: true,
  error: null,
});

export function useExplorerContext(): ExplorerContextValue {
  return useContext(ExplorerContext);
}

function defaultScenarioForDataset(dataset: DatasetKey, ids: string[]): ScenarioViewId {
  if (dataset !== 'comparison') return dataset;
  if (ids.includes('A')) return 'A';
  return (ids[0] as ScenarioViewId) ?? 'A';
}

export function ExplorerProviders({ children }: { children: ReactNode }) {
  const dataset = useExplorerStore((s) => s.dataset);
  const payload = useExplorerStore((s) => s.payload);
  const setPayload = useExplorerStore((s) => s.setPayload);
  const setScenarioId = useExplorerStore((s) => s.setScenarioId);
  const setView = useExplorerStore((s) => s.setView);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPresentationPayload(dataset)
      .then((p) => {
        if (cancelled) return;
        setPayload(p);
        const ids = normalizeScenarios(p).map((s) => s.id);
        setScenarioId(defaultScenarioForDataset(dataset, ids));
        setView('region');
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setPayload(null);
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataset, setPayload, setScenarioId, setView]);

  useEffect(() => {
    if (!payload) {
      delete window.modsimExplorer;
      return;
    }

    const adapter: ModsimExplorer = {
      payload,
      state: displayState,
      setTime: (t) => useExplorerStore.getState().setTime(t),
      setPlaying: (playing) => useExplorerStore.getState().setPlaying(playing),
      setScenarioId: (id) => useExplorerStore.getState().setScenarioId(id),
      setView: (view) => useExplorerStore.getState().setView(view),
      setCameraMode: (mode) => useExplorerStore.getState().setCameraMode(mode),
      get time() {
        return useExplorerStore.getState().time;
      },
      get playing() {
        return useExplorerStore.getState().playing;
      },
      get scenarioId() {
        return useExplorerStore.getState().scenarioId;
      },
      get view() {
        return useExplorerStore.getState().view;
      },
      get cameraMode() {
        return useExplorerStore.getState().cameraMode;
      },
    };
    window.modsimExplorer = adapter;
    return () => {
      delete window.modsimExplorer;
    };
  }, [payload]);

  const value = useMemo(() => ({ loading, error }), [loading, error]);

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
}