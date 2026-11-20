'use client';

import { fmt, percent } from '@/lib/display/format';
import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function CellInspector() {
  const payload = useExplorerStore((s) => s.payload);
  const selectedCell = useExplorerStore((s) => s.selectedCell);
  const time = useExplorerStore((s) => s.time);
  const stateAt = useExplorerStore((s) => s.stateAt);

  if (!payload) {
    return (
      <section className="explorer-inspector" aria-busy="true">
        <p className="text-sm text-[var(--shell-muted)]">Select a grid cell on the map.</p>
      </section>
    );
  }

  if (!selectedCell) {
    return (
      <section className="explorer-inspector">
        <h3 className="explorer-panel-heading">Cell inspector</h3>
        <p className="text-sm text-[var(--shell-muted)] leading-relaxed">
          Click an active cell on the map to inspect population, PGV, displayed probability, and
          final separate losses.
        </p>
      </section>
    );
  }

  const scenario =
    getScenarioById(payload, selectedCell.scenarioId) ??
    normalizeScenarios(payload)[0];
  const grid = payload.grid;
  const cellIdx = selectedCell.cellIndex;
  const cellId = scenario.cell_id[cellIdx];
  const gridIdx = grid.cell_id.indexOf(cellId);
  if (gridIdx < 0) {
    return null;
  }

  const display = stateAt(scenario, time);
  const currentP = display.damage[cellIdx] ?? 0;

  return (
    <section className="explorer-inspector" data-cell-id={cellId}>
      <h3 className="explorer-panel-heading">
        Scenario {scenario.id} · Cell {cellId}
      </h3>
      <p className="text-xs text-[var(--shell-muted)] mb-3 leading-relaxed">
        Current probability follows playback; other values are final model outputs.
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <CellMetric label="Population" value={fmt(grid.population[gridIdx])} />
        <CellMetric label="Final PGV" value={`${fmt(scenario.pgv_cm_s[cellIdx])} cm/s`} />
        <CellMetric label="Current displayed probability" value={percent(currentP)} />
        <CellMetric label="Final heavy probability" value={percent(scenario.final_heavy[cellIdx])} />
        <CellMetric label="Expected deaths" value={fmt(scenario.final_losses[cellIdx][0])} />
        <CellMetric label="Expected injuries" value={fmt(scenario.final_losses[cellIdx][1])} />
      </dl>
    </section>
  );
}

function CellMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--shell-muted)]">{label}</dt>
      <dd className="font-mono text-base mt-1">{value}</dd>
    </div>
  );
}