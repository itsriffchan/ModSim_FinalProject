'use client';

import { fmt } from '@/lib/display/format';
import type { PresentationPayload, ScenarioPayload } from '@/lib/payload/types';
import type { MapViewport } from '@/components/map';
import { ScenarioHeatmap } from '@/components/map';
import type { CameraMode } from '@/lib/store/explorer-store';

function epicenterLabel(settings: ScenarioPayload['settings']): string {
  const epicenter = settings.epicenter;
  if (epicenter === 'baseline' || epicenter === 'Pasig') return 'Pasig';
  if (typeof epicenter === 'string' && epicenter.toLowerCase().includes('munt')) return 'Muntinlupa';
  return String(epicenter ?? '—');
}

export function ComparePanel({
  payload,
  scenario,
  damage,
  counts,
  time,
  viewport,
  onViewportChange,
  cameraMode,
  highlightedCellIds,
  dimUnhighlighted,
  lguHighlightPcode,
}: {
  payload: PresentationPayload;
  scenario: ScenarioPayload;
  damage: number[];
  counts: [number, number];
  time: number;
  viewport: MapViewport;
  onViewportChange?: (v: MapViewport) => void;
  cameraMode: CameraMode;
  highlightedCellIds?: Set<number>;
  dimUnhighlighted?: boolean;
  lguHighlightPcode?: string | null;
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
      <ScenarioHeatmap
        payload={payload}
        scenario={scenario}
        damage={damage}
        time={time}
        viewport={viewport}
        onViewportChange={onViewportChange}
        cameraMode={cameraMode}
        highlightedCellIds={highlightedCellIds}
        dimUnhighlighted={dimUnhighlighted}
        lguHighlightPcode={lguHighlightPcode}
        className="min-h-[220px]"
        aria-label={`Compare scenario ${scenario.id}`}
      />
    </article>
  );
}