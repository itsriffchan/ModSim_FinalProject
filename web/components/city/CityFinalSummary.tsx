'use client';

import { lguRow } from '@/lib/allocation/housing-share';
import { fmt } from '@/lib/display/format';
import type { ScenarioPayload } from '@/lib/payload/types';

export function CityFinalSummary({
  scenario,
  adm3_pcode,
  lguName,
}: {
  scenario: ScenarioPayload;
  adm3_pcode: string;
  lguName: string;
}) {
  const row = lguRow(scenario, adm3_pcode);
  if (!row) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
        No saved final row for {lguName}.
      </div>
    );
  }

  return (
    <section
      className="rounded-md border border-slate-300 bg-white p-3 shadow-sm"
      aria-label={`Final saved totals for ${lguName}`}
    >
      <h3 className="text-sm font-semibold text-slate-900">Final saved LGU totals</h3>
      <p className="text-xs text-slate-500">Fixed scenario totals — unchanged during playback.</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-slate-600">Population (2020)</dt>
        <dd>{fmt(row.population_2020)}</dd>
        <dt className="text-slate-600">Occupied housing units</dt>
        <dd>{fmt(row.occupied_housing_units)}</dd>
        <dt className="text-slate-600">Expected deaths</dt>
        <dd>{fmt(row.expected_deaths)}</dd>
        <dt className="text-slate-600">Expected nonfatal injuries</dt>
        <dd>{fmt(row.expected_injuries)}</dd>
        <dt className="text-slate-600">Deaths per 1,000</dt>
        <dd>{fmt(row.deaths_per_1000_residents)}</dd>
        <dt className="text-slate-600">Injuries per 1,000</dt>
        <dd>{fmt(row.injuries_per_1000_residents)}</dd>
      </dl>
    </section>
  );
}