'use client';

import { gridCenterM, projectXY } from '@/lib/display/projection';
import type { GridPayload, OverlaysPayload, ScenarioPayload } from '@/lib/payload/types';

function pathFromPairs(
  grid: GridPayload,
  pairs: [number, number][] | (number | null)[][],
): string {
  const segments: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) {
      segments.push(current.join(' '));
      current = [];
    }
  };
  for (const pair of pairs) {
    const x = Array.isArray(pair) ? pair[0] : null;
    const y = Array.isArray(pair) ? pair[1] : null;
    if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y)) {
      flush();
      continue;
    }
    const p = projectXY(grid, x, y);
    current.push(`${current.length === 0 ? 'M' : 'L'} ${p.x.toFixed(4)} ${(-p.y).toFixed(4)}`);
  }
  flush();
  return segments.join(' ');
}

export interface MapOverlaysProps {
  grid: GridPayload;
  overlays: OverlaysPayload;
  scenario: ScenarioPayload;
  highlightPcode?: string | null;
}

export function MapOverlays({ grid, overlays, scenario, highlightPcode }: MapOverlaysProps) {
  const [ex, ey] = scenario.epicenter_xy_m;
  const epicenter = projectXY(grid, ex, ey);
  const cross = 0.65;

  return (
    <g className="map-overlays" aria-hidden>
      {overlays.lgu.map((lgu) => (
        <path
          key={lgu.pcode}
          d={pathFromPairs(grid, lgu.xy_m)}
          fill="none"
          stroke={lgu.pcode === highlightPcode ? '#1d4ed8' : '#354d60'}
          strokeWidth={lgu.pcode === highlightPcode ? 0.08 : 0.05}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path
        d={pathFromPairs(grid, overlays.fault_xy_m as [number, number][])}
        fill="none"
        stroke="#a92349"
        strokeWidth={0.06}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={epicenter.x} cy={-epicenter.y} r={0.35} fill="#101b27" stroke="#fff" strokeWidth={0.04} />
      <line
        x1={epicenter.x - cross}
        y1={-epicenter.y}
        x2={epicenter.x + cross}
        y2={-epicenter.y}
        stroke="#101b27"
        strokeWidth={0.04}
      />
      <line
        x1={epicenter.x}
        y1={-epicenter.y - cross}
        x2={epicenter.x}
        y2={-epicenter.y + cross}
        stroke="#101b27"
        strokeWidth={0.04}
      />
    </g>
  );
}

export function mapViewBox(grid: GridPayload): string {
  const [cx, cy] = gridCenterM(grid);
  const half = grid.cell_size_m / 1000;
  const xs = grid.x_m.map((x) => (x - cx) / 1000);
  const ys = grid.y_m.map((y) => (y - cy) / 1000);
  const minX = Math.min(...xs) - half;
  const maxX = Math.max(...xs) + half;
  const minY = Math.min(...ys) - half;
  const maxY = Math.max(...ys) + half;
  const pad = 2;
  return `${minX - pad} ${-(maxY + pad)} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
}