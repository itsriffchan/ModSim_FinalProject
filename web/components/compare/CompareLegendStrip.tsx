'use client';

import { probabilityColorHex } from '@/lib/display/colors';

const TICKS = [0, 0.02, 0.04, 0.06, 0.08, 0.1];

export function CompareLegendStrip() {
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs shadow-sm"
      role="img"
      aria-label="Heavy damage probability legend, 0 to 10 percent"
    >
      <span className="font-medium text-slate-700">Heavy damage probability</span>
      <div className="flex h-3 flex-1 min-w-[200px] overflow-hidden rounded">
        {TICKS.slice(0, -1).map((t, i) => (
          <span
            key={t}
            style={{ backgroundColor: probabilityColorHex((t + TICKS[i + 1]) / 2) }}
            className="flex-1"
          />
        ))}
      </div>
      <span>0%</span>
      <span className="text-slate-500">saturation at 10% · values above 10% retain true probability</span>
    </div>
  );
}