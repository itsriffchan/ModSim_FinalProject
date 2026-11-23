'use client';

import { ScenarioOsmMap, type LinkedMapCenter, type MapFrame } from '@/components/map/ScenarioOsmMap';
import { fmt } from '@/lib/display/format';
import type { ScenarioPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

function epicenterLabel(settings: ScenarioPayload['settings']): string {
  const epicenter = settings.epicenter;
  if (epicenter === 'baseline' || epicenter === 'Pasig') return 'Pasig';
  if (typeof epicenter === 'string' && epicenter.toLowerCase().includes('munt')) return 'Muntinlupa';
  return String(epicenter ?? '—');
}

export function ComparePanel({
  scenario,
  frame,
  highlightCellIds,
  highlightKey,
  linkedCenter,
  onUserPan,
}: {
  scenario: ScenarioPayload;
  frame: MapFrame;
  highlightCellIds: Set<number> | null;
  highlightKey: string;
  linkedCenter: LinkedMapCenter | null;
  onUserPan?: (center: { lng: number; lat: number }) => void;
}) {
  const time = useExplorerStore((s) => s.time);
  const stateAt = useExplorerStore((s) => s.stateAt);
  const counts = stateAt(scenario, time).counts;

  return (
    <article className="explorer-compare-panel" data-testid="compare-panel">
      <header className="explorer-compare-panel-head">
        <h2>
          {scenario.id} · {epicenterLabel(scenario.settings)} · {scenario.duration_s} s
        </h2>
        <p>
          Deaths <strong>{fmt(counts[0])}</strong>
          {' · '}
          Injuries <strong>{fmt(counts[1])}</strong>
          {' · '}
          animated NCR expectations
        </p>
      </header>
      <ScenarioOsmMap
        scenarioId={scenario.id}
        frame={frame}
        testId={`compare-osm-map-${scenario.id}`}
        ariaLabel={`Compare scenario ${scenario.id}`}
        nav="compare"
        showCaption={false}
        layout="compare"
        highlightCellIds={highlightCellIds}
        highlightKey={highlightKey}
        linkedCenter={linkedCenter}
        onUserPan={onUserPan}
      />
    </article>
  );
}
