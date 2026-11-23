'use client';

import { useMemo } from 'react';

import { projectXY, gridCenterM } from '@/lib/display/projection';
import type { GridPayload, OverlaysPayload } from '@/lib/payload/types';

export function NcrLocator({
  grid,
  overlays,
  focusPcode,
}: {
  grid: GridPayload;
  overlays: OverlaysPayload;
  focusPcode: string;
}) {
  const viewBox = useMemo(() => {
    const [cx, cy] = gridCenterM(grid);
    const xs = grid.x_m.map((x) => (x - cx) / 1000);
    const ys = grid.y_m.map((y) => (y - cy) / 1000);
    const pad = 1;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    return `${minX} ${-(maxY)} ${maxX - minX} ${maxY - minY}`;
  }, [grid]);

  const focus = overlays.lgu.find((l) => l.pcode === focusPcode);

  return (
    <div className="rounded-md border border-slate-300 bg-white p-2 shadow-sm" aria-label="NCR locator">
      <p className="text-xs font-medium text-slate-600">NCR locator</p>
      <svg viewBox={viewBox} className="mt-1 h-24 w-full text-slate-700">
        {overlays.lgu.map((lgu) => {
          const pts = (lgu.xy_m as [number, number][])
            .filter((p) => p[0] != null && p[1] != null)
            .map((p) => {
              const v = projectXY(grid, p[0], p[1]);
              return `${v.x},${-v.y}`;
            })
            .join(' ');
          if (!pts) return null;
          return (
            <polyline
              key={lgu.pcode}
              fill="none"
              stroke={lgu.pcode === focusPcode ? '#2563eb' : '#94a3b8'}
              strokeWidth={lgu.pcode === focusPcode ? 0.12 : 0.06}
              points={pts}
            />
          );
        })}
        {focus ? <title>{focus.name}</title> : null}
      </svg>
    </div>
  );
}