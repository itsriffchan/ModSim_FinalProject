'use client';

import { useState } from 'react';

import { fmt } from '@/lib/display/format';
import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';

import { LguTotalsDialog } from '@/components/panels/LguTotalsDialog';

function epicenterLabel(epicenter?: string): string {
  return epicenter === 'baseline' ? 'Pasig' : 'Muntinlupa';
}

export function RegionSummary() {
  const [lguOpen, setLguOpen] = useState(false);
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const time = useExplorerStore((s) => s.time);
  const playing = useExplorerStore((s) => s.playing);
  const stateAt = useExplorerStore((s) => s.stateAt);

  if (!payload) {
    return (
      <section className="explorer-panel-card" aria-busy="true">
        <p className="text-sm text-[var(--shell-muted)]">Loading summary…</p>
      </section>
    );
  }

  const scenario =
    scenarioId === 'all'
      ? normalizeScenarios(payload)[0]
      : getScenarioById(payload, scenarioId) ?? normalizeScenarios(payload)[0];

  const display = stateAt(scenario, time);
  const status =
    time >= payload.horizon_s
      ? 'Complete · final NCR expectations'
      : `${playing ? 'Playing' : time === 0 ? 'Paused at origin' : 'Paused'} · animated NCR expectations · assumed timing`;

  return (
    <>
      <section className="explorer-panel-card explorer-panel-accent">
        <p className="text-xs font-mono uppercase tracking-wider text-[var(--shell-muted)]">
          Region summary
        </p>
        <h2 className="text-lg font-semibold mt-1">
          Scenario {scenario.id} · {epicenterLabel(scenario.settings.epicenter)} ·{' '}
          {scenario.duration_s} s
        </h2>
        <p className="text-xs text-[var(--shell-muted)] mt-2">{status}</p>
        <dl className="grid grid-cols-2 gap-3 mt-4 font-mono text-sm">
          <div>
            <dt className="text-[var(--shell-muted)]">Expected deaths</dt>
            <dd className="text-xl mt-1" data-testid="region-deaths">
              {fmt(display.counts[0])}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--shell-muted)]">Expected injuries</dt>
            <dd className="text-xl mt-1">{fmt(display.counts[1])}</dd>
          </div>
        </dl>
        <button
          type="button"
          className="explorer-btn-primary mt-4 w-full"
          onClick={() => setLguOpen(true)}
        >
          View final LGU totals
        </button>
      </section>
      <LguTotalsDialog open={lguOpen} onOpenChange={setLguOpen} />
    </>
  );
}