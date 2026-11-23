'use client';

import { useMemo, useState } from 'react';

import { scenarioCellIndicesForLgu } from '@/lib/allocation/housing-share';
import type { LinkedMapCenter } from '@/components/map/ScenarioOsmMap';
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
  const linked = useExplorerStore((s) => s.linkedCameras);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  const [linkedCenter, setLinkedCenter] = useState<LinkedMapCenter | null>(null);

  const ordered = useMemo(() => {
    const order = ['A', 'B', 'C'];
    return [...scenarios].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [scenarios]);

  const onUserPan = (center: { lng: number; lat: number }) => {
    if (!useExplorerStore.getState().linkedCameras) return;
    setLinkedCenter((previous) => {
      if (
        previous &&
        Math.abs(previous.lng - center.lng) < 1e-7 &&
        Math.abs(previous.lat - center.lat) < 1e-7
      ) {
        return previous;
      }
      return { ...center, nonce: (previous?.nonce ?? 0) + 1 };
    });
  };

  return (
    <div
      className="explorer-compare-grid grid grid-cols-1 gap-3 min-[1100px]:grid-cols-3"
      data-testid="compare-grid"
    >
      {ordered.map((scenario) => {
        const indices =
          lguPcode != null ? scenarioCellIndicesForLgu(payload, scenario, lguPcode) : [];
        const highlight =
          lguPcode && indices.length
            ? new Set(indices.map((index) => scenario.cell_id[index]!))
            : null;
        return (
          <ComparePanel
            key={scenario.id}
            scenario={scenario}
            frame={lguPcode ? { kind: 'lgu', pcode: lguPcode } : { kind: 'ncr' }}
            highlightCellIds={highlight}
            highlightKey={highlight && lguPcode ? lguPcode : ''}
            linkedCenter={linked ? linkedCenter : null}
            onUserPan={linked ? onUserPan : undefined}
          />
        );
      })}
    </div>
  );
}
