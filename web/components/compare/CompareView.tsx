'use client';

import { useEffect } from 'react';

import { PlaybackBar } from '@/components/panels/PlaybackBar';
import { normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { DatasetSwitcher } from '@/components/shell/DatasetSwitcher';
import { ExplorerFrame } from '@/components/shell/ExplorerFrame';
import { ExplorerProviders } from '@/components/shell/ExplorerProviders';

import { CompareGrid } from './CompareGrid';
import { CompareInterpretation } from './CompareInterpretation';
import { CompareLegendStrip } from './CompareLegendStrip';
import { GeographicSelector } from './GeographicSelector';
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
      toolbar={
        <>
          <DatasetSwitcher />
          <GeographicSelector payload={payload} />
          <LinkedCamerasToggle />
        </>
      }
    >
      <div className="space-y-3">
        <UnavailableComparisonNotice scenarios={scenarios} />
        <CompareInterpretation />
        <CompareLegendStrip />
        <p className="text-xs text-[var(--shell-muted)]">
          Three region maps. Scroll zoom is off. A city choice frames every panel. Playback
          spreads each choropleth without moving the cameras.
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
