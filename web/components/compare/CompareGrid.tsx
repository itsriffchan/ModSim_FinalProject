'use client';

import { useMemo, useState } from 'react';

import { scenarioCellIndicesForLgu } from '@/lib/allocation/housing-share';
import type { MapPose } from '@/components/map/MapCanvas';
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
  const geographicFocus = useExplorerStore((s) => s.geographicFocus);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  const stateAt = useExplorerStore((s) => s.stateAt);
  const [linkedPose, setLinkedPose] = useState<MapPose | undefined>();
  const [localPoses, setLocalPoses] = useState<(MapPose | undefined)[]>([
    undefined,
    undefined,
    undefined,
  ]);

  const focusXyM = useMemo(() => {
    if (!geographicFocus || !lguPcode) return undefined;
    const lgu = payload.overlays.lgu.find((l) => l.pcode === lguPcode);
    return lgu?.xy_m;
  }, [geographicFocus, lguPcode, payload.overlays.lgu]);

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
        const pose = linked ? linkedPose : localPoses[idx];
        const onPoseChange = linked
          ? setLinkedPose
          : (p: MapPose) =>
              setLocalPoses((prev) => {
                const next = [...prev];
                next[idx] = p;
                return next;
              });
        return (
          <ComparePanel
            key={scenario.id}
            payload={payload}
            scenario={scenario}
            damage={st.damage}
            counts={st.counts}
            time={time}
            pose={pose}
            onPoseChange={onPoseChange}
            focusXyM={focusXyM}
            highlightedCellIds={highlightFor(scenario)}
            dimUnhighlighted={geographicFocus && Boolean(lguPcode)}
          />
        );
      })}
    </div>
  );
}