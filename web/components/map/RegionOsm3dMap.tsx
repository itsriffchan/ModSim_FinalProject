'use client';

import { useMemo, useState } from 'react';

import { ScenarioOsmMap } from '@/components/map/ScenarioOsmMap';
import { scenarioCellIndicesForLgu } from '@/lib/allocation/housing-share';
import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function RegionOsm3dMap({ className = '' }: { className?: string }) {
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  const geographicFocus = useExplorerStore((s) => s.geographicFocus);
  const setLguPcode = useExplorerStore((s) => s.setLguPcode);
  const setGeographicFocus = useExplorerStore((s) => s.setGeographicFocus);
  const [resetNonce, setResetNonce] = useState(0);

  const scenarios = payload ? normalizeScenarios(payload) : [];
  const scenario =
    payload && scenarioId !== 'all'
      ? getScenarioById(payload, scenarioId) ?? scenarios[0]
      : scenarios[0];

  const highlightIds = useMemo(() => {
    if (!payload || !scenario || !lguPcode || !geographicFocus) return null;
    const indices = scenarioCellIndicesForLgu(payload, scenario, lguPcode);
    if (!indices.length) return null;
    return new Set(indices.map((index) => scenario.cell_id[index]!));
  }, [geographicFocus, lguPcode, payload, scenario]);

  if (!scenario) {
    return (
      <div className={`explorer-map-stage ${className}`} aria-busy="true">
        <div className="flex h-full items-center justify-center text-sm text-[var(--shell-muted)]">
          Loading map…
        </div>
      </div>
    );
  }

  return (
    <ScenarioOsmMap
      scenarioId={scenario.id}
      frame={lguPcode ? { kind: 'lgu', pcode: lguPcode } : { kind: 'ncr' }}
      resetNonce={resetNonce}
      className={className}
      testId="region-osm3d-map"
      ariaLabel="Region 3D map"
      nav="region"
      layout="region"
      highlightCellIds={highlightIds}
      highlightKey={highlightIds && lguPcode ? lguPcode : ''}
      onResetView={() => {
        setLguPcode(null);
        setGeographicFocus(false);
        setResetNonce((nonce) => nonce + 1);
      }}
    />
  );
}
