'use client';

import { useCallback, useMemo, useRef } from 'react';

import {
  arrivalBoundarySegmentIndices,
  buildArrivalEdges,
} from '@/lib/display/arrivalEdges';
import {
  AWAITING_CELL_RGB,
  INACTIVE_CELL_HEX,
  probabilityColorHex,
  ARRIVAL_EDGE_HEX,
} from '@/lib/display/colors';
import { projectXY } from '@/lib/display/projection';
import type { GridPayload, PresentationPayload, ScenarioPayload } from '@/lib/payload/types';

import { MapCameraLabel, MapNorthBadge, MapScaleBadge } from './MapChrome';
import { MapOverlays, mapViewBox } from './MapOverlays';
import type { MapViewport } from './useMapViewport';
import type { CameraMode } from '@/lib/store/explorer-store';

function awaitingHex(): string {
  const { r, g, b } = AWAITING_CELL_RGB;
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

function inactiveHex(): string {
  const r = (INACTIVE_CELL_HEX >> 16) & 0xff;
  const g = (INACTIVE_CELL_HEX >> 8) & 0xff;
  const b = INACTIVE_CELL_HEX & 0xff;
  return `rgb(${r},${g},${b})`;
}

export interface ScenarioHeatmapProps {
  payload: PresentationPayload;
  scenario: ScenarioPayload;
  damage: number[];
  time: number;
  viewport: MapViewport;
  onViewportChange?: (v: MapViewport) => void;
  cameraMode?: CameraMode;
  highlightedCellIds?: Set<number>;
  dimUnhighlighted?: boolean;
  selectedCellId?: number | null;
  onSelectCell?: (cellId: number | null) => void;
  lguHighlightPcode?: string | null;
  className?: string;
  'aria-label'?: string;
}

export function ScenarioHeatmap({
  payload,
  scenario,
  damage,
  time,
  viewport,
  onViewportChange,
  cameraMode = 'bird',
  highlightedCellIds,
  dimUnhighlighted = false,
  selectedCellId,
  onSelectCell,
  lguHighlightPcode,
  className = '',
  'aria-label': ariaLabel,
}: ScenarioHeatmapProps) {
  const grid = payload.grid;
  const half = grid.cell_size_m / 1000;
  const index = useMemo(() => new Map(grid.cell_id.map((id, i) => [id, i])), [grid.cell_id]);
  const edges = useMemo(() => buildArrivalEdges(grid, scenario), [grid, scenario]);
  const activeEdgeIdx = useMemo(
    () => arrivalBoundarySegmentIndices(edges, scenario.onset_s, time),
    [edges, scenario.onset_s, time],
  );

  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const start = dragRef.current;
      dragRef.current = null;
      if (!start) return;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (moved > 5) return;
      if (!onSelectCell) return;
      const svg = e.currentTarget;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const local = pt.matrixTransform(svg.getScreenCTM()?.inverse());
      const xKm = local.x;
      const yKm = -local.y;
      let best: { id: number; d: number } | null = null;
      for (const cellId of scenario.cell_id) {
        const g = index.get(cellId)!;
        const p = projectXY(grid, grid.x_m[g], grid.y_m[g]);
        const d = Math.hypot(p.x - xKm, p.y - yKm);
        if (d <= half * 0.75 && (!best || d < best.d)) best = { id: cellId, d };
      }
      onSelectCell(best ? best.id : null);
    },
    [grid, half, index, onSelectCell, scenario.cell_id],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !onViewportChange) return;
      if (e.buttons !== 1) return;
      const dx = (e.clientX - dragRef.current.x) / (40 * viewport.zoom);
      const dy = (e.clientY - dragRef.current.y) / (40 * viewport.zoom);
      dragRef.current = { x: e.clientX, y: e.clientY };
      onViewportChange({
        ...viewport,
        panX: viewport.panX + dx,
        panY: viewport.panY - dy,
      });
    },
    [onViewportChange, viewport],
  );

  const transform = `translate(${viewport.panX} ${viewport.panY}) scale(${viewport.zoom})`;
  const perspectiveSkew = cameraMode === 'oblique' ? 'skewX(-12)' : cameraMode === 'low' ? 'scale(1,0.82)' : '';

  return (
    <div
      className={`relative min-h-[280px] flex-1 overflow-hidden rounded-md border border-slate-300 bg-[#e8ecef] ${className}`}
    >
      <MapNorthBadge />
      <MapScaleBadge />
      {cameraMode !== 'bird' ? (
        <div className="absolute right-3 top-3 max-w-[200px] rounded bg-white/90 px-2 py-1 shadow-sm">
          <MapCameraLabel mode={cameraMode} />
        </div>
      ) : null}
      <svg
        className="h-full w-full touch-none"
        viewBox={mapViewBox(grid)}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ariaLabel ?? `Scenario ${scenario.id} damage map`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        onWheel={(e) => {
          if (!onViewportChange) return;
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
          onViewportChange({
            ...viewport,
            zoom: Math.min(8, Math.max(0.45, viewport.zoom * factor)),
          });
        }}
      >
        <g transform={transform}>
          <g transform={perspectiveSkew}>
            {grid.cell_id.map((id, gi) => {
              if (grid.active[gi]) return null;
              const p = projectXY(grid, grid.x_m[gi], grid.y_m[gi]);
              return (
                <rect
                  key={`in-${id}`}
                  x={p.x - half}
                  y={-p.y - half}
                  width={half * 2}
                  height={half * 2}
                  fill={inactiveHex()}
                />
              );
            })}
            {scenario.cell_id.map((id, li) => {
              const gi = index.get(id)!;
              const p = projectXY(grid, grid.x_m[gi], grid.y_m[gi]);
              const arrived = time >= scenario.onset_s[li];
              const prob = damage[li] ?? 0;
              const highlighted = !highlightedCellIds || highlightedCellIds.has(id);
              const fill = !arrived
                ? awaitingHex()
                : probabilityColorHex(prob);
              const opacity =
                dimUnhighlighted && highlightedCellIds && !highlightedCellIds.has(id) ? 0.25 : 1;
              const stroke = selectedCellId === id ? '#f59e0b' : 'none';
              return (
                <rect
                  key={`ac-${id}`}
                  x={p.x - half}
                  y={-p.y - half}
                  width={half * 2}
                  height={half * 2}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke={stroke}
                  strokeWidth={selectedCellId === id ? 0.08 : 0}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            <g>
              {activeEdgeIdx.map((ei) => {
                const edge = edges[ei];
                const [a, b] = edge.points;
                return (
                  <line
                    key={ei}
                    x1={projectXY(grid, a[0], a[1]).x}
                    y1={-projectXY(grid, a[0], a[1]).y}
                    x2={projectXY(grid, b[0], b[1]).x}
                    y2={-projectXY(grid, b[0], b[1]).y}
                    stroke={`#${ARRIVAL_EDGE_HEX.toString(16).padStart(6, '0')}`}
                    strokeWidth={0.06}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
            <MapOverlays
              grid={grid}
              overlays={payload.overlays}
              scenario={scenario}
              highlightPcode={lguHighlightPcode}
            />
          </g>
        </g>
      </svg>
      <p className="sr-only">Illustrative terrain and buildings are not shown; heatmap uses saved grid geometry only.</p>
    </div>
  );
}