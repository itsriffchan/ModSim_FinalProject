'use client';

import { useMemo } from 'react';

import { scenarioCellIndicesForLgu } from '@/lib/allocation/housing-share';
import { useMapViewport } from '@/components/map';
import type { PresentationPayload, ScenarioPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

import { ComparePanel } from './ComparePanel';

export function CompareGrid({
  payload,
  scenarios,
}: {
  payload: PresentationPayload;
  scenarios: ScenarioPayload[];
}) {
  const time = useExplorerStore((s) => s.time);
  const linked = useExplorerStore((s) => s.linkedCameras);
  const cameraMode = useExplorerStore((s) => s.cameraMode);
  const geographicFocus = useExplorerStore((s) => s.geographicFocus);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  const stateAt = useExplorerStore((s) => s.stateAt);
  const primaryMap = useMapViewport();
  const maps = [useMapViewport(), useMapViewport(), useMapViewport()];

  const shareViewport = (v: typeof primaryMap.viewport) => {
    if (linked) {
      primaryMap.setFrom(v);
      maps.forEach((m) => m.setFrom(v));
    }
  };

  const highlightFor = (scenario: ScenarioPayload) => {
    if (!geographicFocus || !lguPcode) return undefined;
    const indices = scenarioCellIndicesForLgu(payload, scenario, lguPcode);
    return new Set(indices.map((i) => scenario.cell_id[i]));
  };

  const ordered = useMemo(() => {
    const order = ['A', 'B', 'C'];
    return [...scenarios].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [scenarios]);

  return (
    <div
      className={`grid gap-3 ${ordered.length > 1 ? 'md:grid-cols-3' : 'grid-cols-1'}`}
      style={{ ['--count' as string]: ordered.length }}
    >
      {ordered.map((scenario, idx) => {
        const st = stateAt(scenario);
        const viewport = linked ? primaryMap.viewport : maps[idx].viewport;
        const onViewportChange = linked
          ? shareViewport
          : (v: typeof viewport) => maps[idx].setFrom(v);
        return (
          <ComparePanel
            key={scenario.id}
            payload={payload}
            scenario={scenario}
            damage={st.damage}
            counts={st.counts}
            time={time}
            viewport={viewport}
            onViewportChange={onViewportChange}
            cameraMode={cameraMode}
            highlightedCellIds={highlightFor(scenario)}
            dimUnhighlighted={geographicFocus && Boolean(lguPcode)}
            lguHighlightPcode={lguPcode}
          />
        );
      })}
    </div>
  );
}