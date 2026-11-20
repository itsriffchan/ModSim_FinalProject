'use client';

import { useEffect } from 'react';

import { ExplorerDisclaimer, ExplorerShell } from '@/components/shell/ExplorerShell';
import { PlaybackBar } from '@/components/shell/PlaybackBar';
import { normalizeScenarios } from '@/lib/payload/load';
import { useExplorerPlayback } from '@/lib/hooks/useExplorerPlayback';
import { usePayloadBootstrap } from '@/lib/hooks/usePayloadBootstrap';
import { useExplorerStore } from '@/lib/store/explorer-store';

import { CompareGrid } from './CompareGrid';
import { CompareInterpretation } from './CompareInterpretation';
import { CompareLegendStrip } from './CompareLegendStrip';
import { GeographicSelector } from './GeographicSelector';
import { LinkedCamerasToggle } from './LinkedCamerasToggle';
import { UnavailableComparisonNotice } from './UnavailableComparisonNotice';

export function CompareView() {
  const { loading, error } = usePayloadBootstrap('comparison');
  const payload = useExplorerStore((s) => s.payload);
  const setView = useExplorerStore((s) => s.setView);
  const setScenarioId = useExplorerStore((s) => s.setScenarioId);

  useExplorerPlayback();

  useEffect(() => {
    setView('compare');
    setScenarioId('all');
  }, [setScenarioId, setView]);

  if (loading) {
    return <ExplorerShell title="Compare">Loading presentation payload…</ExplorerShell>;
  }
  if (error || !payload) {
    return (
      <ExplorerShell title="Compare">
        <p className="text-red-800">{error ?? 'No payload'}</p>
      </ExplorerShell>
    );
  }

  const scenarios = normalizeScenarios(payload);

  return (
    <ExplorerShell title="Compare scenarios A · B · C">
      <ExplorerDisclaimer />
      <UnavailableComparisonNotice scenarios={scenarios} />
      <CompareInterpretation />
      <div className="flex flex-wrap gap-2">
        <LinkedCamerasToggle />
        <GeographicSelector payload={payload} />
      </div>
      <CompareLegendStrip />
      <CompareGrid payload={payload} scenarios={scenarios} />
      <PlaybackBar />
    </ExplorerShell>
  );
}