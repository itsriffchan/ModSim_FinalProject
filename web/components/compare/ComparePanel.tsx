'use client';

import { fmt } from '@/lib/display/format';
import type { PresentationPayload, ScenarioPayload } from '@/lib/payload/types';
import { MapCanvas, type MapPose } from '@/components/map/MapCanvas';

function epicenterLabel(settings: ScenarioPayload['settings']): string {
  const epicenter = settings.epicenter;
  if (epicenter === 'baseline' || epicenter === 'Pasig') return 'Pasig';
  if (typeof epicenter === 'string' && epicenter.toLowerCase().includes('munt')) return 'Muntinlupa';
  return String(epicenter ?? '—');
}

export function ComparePanel({
  scenario,
  damage,
  counts,
  time,
  pose,
  onPoseChange,
  focusXyM,
  highlightedCellIds,
  dimUnhighlighted,
}: {
  payload: PresentationPayload;
  scenario: ScenarioPayload;
  damage: number[];
  counts: [number, number];
  time: number;
  pose?: MapPose;
  onPoseChange?: (pose: MapPose) => void;
  focusXyM?: (number | null)[][];
  highlightedCellIds?: Set<number>;
  dimUnhighlighted?: boolean;
}) {
  return (
    <article
      className="flex min-w-0 flex-1 flex-col gap-2 rounded-md border border-slate-400 bg-[#eef2f6] p-2 shadow-sm"
      data-testid="compare-panel"
    >
      <header className="rounded bg-white px-2 py-1.5">
        <h2 className="text-sm font-semibold">
          {scenario.id} / {epicenterLabel(scenario.settings)} / {scenario.duration_s} s
        </h2>
        <p className="text-xs text-slate-600">
          Deaths <strong>{fmt(counts[0])}</strong> · Injuries <strong>{fmt(counts[1])}</strong> · animated NCR
          expectations
        </p>
      </header>
      <MapCanvas
        scenario={scenario}
        damage={damage}
        time={time}
        pose={pose}
        onPoseChange={onPoseChange}
        focusXyM={focusXyM}
        highlightedCellIds={highlightedCellIds}
        dimUnhighlighted={dimUnhighlighted}
        className="min-h-[220px]"
        aria-label={`Compare scenario ${scenario.id}`}
      />
    </article>
  );
}