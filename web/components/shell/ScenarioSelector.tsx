'use client';

import { normalizeScenarios } from '@/lib/payload/load';
import type { ScenarioViewId } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

function epicenterLabel(epicenter?: string): string {
  return epicenter === 'baseline' ? 'Pasig' : 'Muntinlupa';
}

export function ScenarioSelector() {
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const setScenarioId = useExplorerStore((s) => s.setScenarioId);

  if (!payload) {
    return (
      <div className="explorer-control-group" aria-busy="true">
        <span className="explorer-control-label">Scenario</span>
        <span className="text-sm text-[var(--shell-muted)]">Loading…</span>
      </div>
    );
  }

  const scenarios = normalizeScenarios(payload);

  return (
    <div className="explorer-control-group" role="group" aria-label="Scenario">
      <span className="explorer-control-label">Scenario</span>
      <div className="flex flex-wrap gap-1.5">
        {scenarios.map((s) => {
          const id = s.id as ScenarioViewId;
          const label = `${s.id} · ${epicenterLabel(s.settings.epicenter)} · ${s.duration_s} s`;
          const pressed = scenarioId === id;
          return (
            <button
              key={s.id}
              type="button"
              className={`explorer-chip ${pressed ? 'explorer-chip-active' : ''}`}
              aria-pressed={pressed}
              onClick={() => setScenarioId(id)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}