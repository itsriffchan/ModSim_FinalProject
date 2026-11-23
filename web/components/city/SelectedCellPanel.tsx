'use client';

import { housingShareInCell, membershipRowsForCell } from '@/lib/allocation/housing-share';
import { fmt, percentFromFraction } from '@/lib/display/format';
import type { GridPayload, PresentationPayload, ScenarioPayload } from '@/lib/payload/types';

export function SelectedCellPanel({
  payload,
  scenario,
  grid,
  cellId,
  damageProb,
}: {
  payload: PresentationPayload;
  scenario: ScenarioPayload;
  grid: GridPayload;
  cellId: number | null;
  damageProb: number | null;
}) {
  if (cellId == null) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-600">
        Select an active cell on the map to inspect saved values.
      </div>
    );
  }

  const gi = grid.cell_id.indexOf(cellId);
  const li = scenario.cell_id.indexOf(cellId);
  if (gi < 0 || li < 0) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Cell {cellId} is inactive in this scenario.
      </div>
    );
  }

  const losses = scenario.final_losses[li];
  const membership = membershipRowsForCell(payload, cellId);

  return (
    <div className="rounded-md border border-slate-300 bg-white p-3 text-sm shadow-sm">
      <h3 className="font-semibold text-slate-900">Cell {cellId}</h3>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <dt className="text-slate-500">Current heavy damage</dt>
        <dd>{damageProb == null ? '—' : percentFromFraction(damageProb)}</dd>
        <dt className="text-slate-500">Final heavy damage</dt>
        <dd>{percentFromFraction(scenario.final_heavy[li])}</dd>
        <dt className="text-slate-500">Population (grid)</dt>
        <dd>{fmt(grid.population[gi])}</dd>
        <dt className="text-slate-500">PGV (cm/s)</dt>
        <dd>{fmt(scenario.pgv_cm_s[li])}</dd>
        <dt className="text-slate-500">Final deaths</dt>
        <dd>{fmt(losses[0])}</dd>
        <dt className="text-slate-500">Final injuries</dt>
        <dd>{fmt(losses[1])}</dd>
      </dl>
      {membership.length > 0 ? (
        <div className="mt-3 border-t border-slate-200 pt-2">
          <p className="text-xs font-medium text-slate-600">Housing share in cell</p>
          <ul className="mt-1 space-y-1 text-xs">
            {membership.map((row) => (
              <li key={`${row.cell_id}-${row.adm3_pcode}`}>
                {row.adm3_pcode}: {percentFromFraction(row.housing_share)} of units
                {row.geometric_intersection ? ' · boundary intersects' : ''}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-slate-500">
            Allocated losses use housing share, not whole-cell totals (
            {percentFromFraction(housingShareInCell(payload, cellId, membership[0].adm3_pcode))} shown for first row).
          </p>
        </div>
      ) : null}
    </div>
  );
}