'use client';

import Link from 'next/link';

import { normalizeScenarios } from '@/lib/payload/load';
import type { PresentationPayload } from '@/lib/payload/types';

export function CityHeader({
  payload,
  lguName,
  scenarioId,
  onScenarioChange,
}: {
  payload: PresentationPayload;
  lguName: string;
  scenarioId: string;
  onScenarioChange: (id: string) => void;
}) {
  const scenarios = normalizeScenarios(payload);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">City perspective</p>
        <h2 className="text-xl font-semibold text-slate-900">{lguName}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600">
          Scenario
          <select
            value={scenarioId}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="ml-2 rounded border border-slate-300 px-2 py-1"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.duration_s}s
              </option>
            ))}
          </select>
        </label>
        <Link href="/" className="text-sm font-medium text-[#1e3a5f] underline hover:no-underline">
          ← Whole NCR
        </Link>
      </div>
    </div>
  );
}