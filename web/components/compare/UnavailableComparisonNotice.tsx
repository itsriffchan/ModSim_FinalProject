'use client';

import type { ScenarioPayload } from '@/lib/payload/types';

const EXPECTED = ['A', 'B', 'C'] as const;

export function UnavailableComparisonNotice({ scenarios }: { scenarios: ScenarioPayload[] }) {
  const present = new Set(scenarios.map((s) => s.id));
  const missing = EXPECTED.filter((id) => !present.has(id));
  if (missing.length === 0) return null;

  return (
    <div
      className="rounded-md border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      <p className="font-semibold">Full A/B/C comparison unavailable</p>
      <p className="mt-1">
        This dataset is missing scenario(s): {missing.join(', ')}. Showing {scenarios.length} saved scenario
        {scenarios.length === 1 ? '' : 's'} only — interpretation labels may not apply to a complete batch comparison.
      </p>
    </div>
  );
}