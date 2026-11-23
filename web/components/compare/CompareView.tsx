'use client';

import { useEffect } from 'react';

import { PlaybackBar } from '@/components/panels/PlaybackBar';
import { normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { ExplorerFrame } from '@/components/shell/ExplorerFrame';
import { ExplorerProviders } from '@/components/shell/ExplorerProviders';

import { CompareGrid } from './CompareGrid';
import { CompareInterpretation } from './CompareInterpretation';
import { CompareLegendStrip } from './CompareLegendStrip';
import { LinkedCamerasToggle } from './LinkedCamerasToggle';
import { UnavailableComparisonNotice } from './UnavailableComparisonNotice';

function CompareBody() {
  const payload = useExplorerStore((s) => s.payload);
  const setView = useExplorerStore((s) => s.setView);

  useEffect(() => {
    setView('compare');
  }, [setView]);

  if (!payload) {
    return <p className="text-sm text-[var(--shell-muted)]">Loading comparison…</p>;
  }

  const scenarios = normalizeScenarios(payload);

  return (
    <ExplorerFrame
      toolbar={<LinkedCamerasToggle />}
    >
      <div className="space-y-3">
        <UnavailableComparisonNotice scenarios={scenarios} />
        <CompareInterpretation />
        <CompareLegendStrip />
        <p className="text-xs text-[var(--shell-muted)]">
          Three region maps. Scroll zoom is off. Use Region LGU seals to frame a city before
          opening Compare if needed. Playback spreads each choropleth without moving the cameras.
        </p>
        <CompareGrid payload={payload} scenarios={scenarios} />
        <PlaybackBar />
      </div>
    </ExplorerFrame>
  );
}

export function CompareView() {
  return (
    <ExplorerProviders view="compare">
      <CompareBody />
    </ExplorerProviders>
  );
}
