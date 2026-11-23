'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import { ScenarioOsmMap } from '@/components/map/ScenarioOsmMap';
import { PlaybackBar } from '@/components/panels/PlaybackBar';
import { scenarioCellIndicesForLgu, lguRow } from '@/lib/allocation/housing-share';
import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { DatasetSwitcher } from '@/components/shell/DatasetSwitcher';
import { ExplorerFrame } from '@/components/shell/ExplorerFrame';
import { ExplorerProviders } from '@/components/shell/ExplorerProviders';
import { ScenarioSelector } from '@/components/shell/ScenarioSelector';

import { AllocationNote } from './AllocationNote';
import { CityFinalSummary } from './CityFinalSummary';
import { CityFocusControls } from './CityFocusControls';
import { LguSidebar } from './LguSidebar';
import { NcrLocator } from './NcrLocator';
import { SelectedCellPanel } from './SelectedCellPanel';

function CityBody({ pcode }: { pcode: string }) {
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const geographicFocus = useExplorerStore((s) => s.geographicFocus);
  const setLguPcode = useExplorerStore((s) => s.setLguPcode);
  const selectedCell = useExplorerStore((s) => s.selectedCell);
  const time = useExplorerStore((s) => s.time);
  const stateAt = useExplorerStore((s) => s.stateAt);

  useEffect(() => {
    setLguPcode(pcode);
  }, [pcode, setLguPcode]);

  const scenarios = useMemo(() => (payload ? normalizeScenarios(payload) : []), [payload]);
  const scenario =
    (payload && scenarioId !== 'all' ? getScenarioById(payload, scenarioId) : undefined) ??
    scenarios[0];
  const lgu = scenario ? lguRow(scenario, pcode) : undefined;
  const lguName = lgu?.lgu_name ?? pcode;

  const highlightIds = useMemo(() => {
    if (!payload || !scenario || !geographicFocus) return null;
    const indices = scenarioCellIndicesForLgu(payload, scenario, pcode);
    if (!indices.length) return null;
    return new Set(indices.map((index) => scenario.cell_id[index]!));
  }, [geographicFocus, payload, pcode, scenario]);

  const damage = scenario && payload ? stateAt(scenario, time).damage : [];
  const selectedId =
    selectedCell && scenario && selectedCell.scenarioId === scenario.id
      ? selectedCell.cellIndex
      : null;
  const selectedCellId = selectedId != null && scenario ? scenario.cell_id[selectedId] : null;
  const selectedDamage = selectedId != null && damage.length ? damage[selectedId] : null;

  if (!payload || !scenario) {
    return <p className="text-sm text-[var(--shell-muted)]">Loading city map…</p>;
  }

  return (
    <ExplorerFrame
      toolbar={
        <>
          <ScenarioSelector />
          <DatasetSwitcher />
          <Link href="/region" className="explorer-text-link">
            Whole NCR
          </Link>
        </>
      }
    >
      <div className="explorer-city-grid">
        <LguSidebar lgus={scenario.lgu} activePcode={pcode} />
        <div className="explorer-map-column explorer-map-column--fill">
          <div className="explorer-city-heading">
            <p className="explorer-eyebrow">City perspective</p>
            <h2 className="text-xl font-semibold">{lguName}</h2>
          </div>
          <ScenarioOsmMap
            scenarioId={scenario.id}
            frame={{ kind: 'lgu', pcode }}
            testId="city-osm-map"
            ariaLabel={`City perspective ${lguName} scenario ${scenario.id}`}
            nav="city"
            highlightCellIds={highlightIds}
            highlightKey={highlightIds ? pcode : ''}
          />
          <PlaybackBar />
        </div>
        <aside className="explorer-side-column space-y-3">
          <CityFinalSummary scenario={scenario} adm3_pcode={pcode} lguName={lguName} />
          <AllocationNote payload={payload} />
          <CityFocusControls payload={payload} />
          <SelectedCellPanel
            payload={payload}
            scenario={scenario}
            grid={payload.grid}
            cellId={selectedCellId ?? null}
            damageProb={selectedDamage ?? null}
          />
          <NcrLocator grid={payload.grid} overlays={payload.overlays} focusPcode={pcode} />
        </aside>
      </div>
    </ExplorerFrame>
  );
}

export function CityView({ pcode }: { pcode: string }) {
  return (
    <ExplorerProviders view="city">
      <CityBody pcode={pcode} />
    </ExplorerProviders>
  );
}
