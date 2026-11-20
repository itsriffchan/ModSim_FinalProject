'use client';

import { useEffect, useMemo } from 'react';

import { scenarioCellIndicesForLgu, lguRow } from '@/lib/allocation/housing-share';
import { MapCanvas } from '@/components/map/MapCanvas';
import { ExplorerDisclaimer, ExplorerShell } from '@/components/shell/ExplorerShell';
import { PlaybackBar } from '@/components/shell/PlaybackBar';
import { normalizeScenarios } from '@/lib/payload/load';
import { useExplorerPlayback } from '@/lib/hooks/useExplorerPlayback';
import { usePayloadBootstrap } from '@/lib/hooks/usePayloadBootstrap';
import { useExplorerStore } from '@/lib/store/explorer-store';

import { AllocationNote } from './AllocationNote';
import { CityFinalSummary } from './CityFinalSummary';
import { CityFocusControls } from './CityFocusControls';
import { CityHeader } from './CityHeader';
import { LguSidebar } from './LguSidebar';
import { NcrLocator } from './NcrLocator';
import { SelectedCellPanel } from './SelectedCellPanel';

export function CityView({ pcode }: { pcode: string }) {
  const { loading, error } = usePayloadBootstrap('comparison');
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const setScenarioId = useExplorerStore((s) => s.setScenarioId);
  const time = useExplorerStore((s) => s.time);
  const geographicFocus = useExplorerStore((s) => s.geographicFocus);
  const setLguPcode = useExplorerStore((s) => s.setLguPcode);
  const setView = useExplorerStore((s) => s.setView);
  const selectedCell = useExplorerStore((s) => s.selectedCell);
  const stateAt = useExplorerStore((s) => s.stateAt);
  useExplorerPlayback();

  useEffect(() => {
    setView('city');
    setLguPcode(pcode);
  }, [pcode, setLguPcode, setView]);

  const scenarios = useMemo(() => (payload ? normalizeScenarios(payload) : []), [payload]);
  const scenario =
    scenarios.find((s) => s.id === scenarioId) ?? scenarios[0] ?? null;
  const lgu = scenario ? lguRow(scenario, pcode) : undefined;
  const lguName = lgu?.lgu_name ?? pcode;

  const highlightIds = useMemo(() => {
    if (!payload || !scenario || !geographicFocus) return undefined;
    const indices = scenarioCellIndicesForLgu(payload, scenario, pcode);
    return new Set(indices.map((i) => scenario.cell_id[i]));
  }, [payload, scenario, geographicFocus, pcode]);

  const focusXyM = useMemo(() => {
    const lguOverlay = payload?.overlays.lgu.find((l) => l.pcode === pcode);
    return lguOverlay?.xy_m;
  }, [payload, pcode]);

  const damage = scenario && payload ? stateAt(scenario).damage : [];
  const selectedId =
    selectedCell && scenario && selectedCell.scenarioId === scenario.id
      ? selectedCell.cellIndex
      : null;
  const selectedCellId =
    selectedId != null && scenario ? scenario.cell_id[selectedId] : null;
  const selectedDamage =
    selectedId != null && damage.length ? damage[selectedId] : null;

  if (loading) {
    return <ExplorerShell title="Loading…">Loading presentation payload…</ExplorerShell>;
  }
  if (error || !payload || !scenario) {
    return (
      <ExplorerShell title="Error">
        <p className="text-red-800">{error ?? 'No scenario data'}</p>
      </ExplorerShell>
    );
  }

  return (
    <ExplorerShell title={`City · ${lguName}`}>
      <ExplorerDisclaimer />
      <AllocationNote payload={payload} />
      <div className="flex flex-col gap-4 md:flex-row">
        <LguSidebar lgus={scenario.lgu} activePcode={pcode} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <CityHeader
            payload={payload}
            lguName={lguName}
            scenarioId={scenario.id}
            onScenarioChange={(id) => setScenarioId(id as import('@/lib/payload/types').ScenarioViewId)}
          />
          <CityFocusControls payload={payload} />
          <MapCanvas
            scenario={scenario}
            damage={damage}
            time={time}
            focusXyM={focusXyM}
            highlightedCellIds={highlightIds}
            dimUnhighlighted={Boolean(highlightIds?.size)}
            className="min-h-[280px]"
            aria-label={`City perspective ${lguName} scenario ${scenario.id}`}
          />
          <PlaybackBar />
          <div className="grid gap-3 lg:grid-cols-2">
            <SelectedCellPanel
              payload={payload}
              scenario={scenario}
              grid={payload.grid}
              cellId={selectedCellId}
              damageProb={selectedDamage}
            />
            <div className="flex flex-col gap-3">
              <CityFinalSummary scenario={scenario} adm3_pcode={pcode} lguName={lguName} />
              <NcrLocator grid={payload.grid} overlays={payload.overlays} focusPcode={pcode} />
            </div>
          </div>
        </div>
      </div>
    </ExplorerShell>
  );
}