import { NO_ACTIVE_CELL_COLOR } from '@/lib/basemap/maplibreConfig';
import {
  AWAITING_CELL_RGB,
  probabilityColorHex,
} from '@/lib/display/colors';
import type { GridPayload, ScenarioPayload } from '@/lib/payload/types';

export interface CellLookupIndex {
  minX: number;
  minY: number;
  cols: number;
  rows: number;
  cellSize: number;
  byRowCol: Map<string, number>;
}

export function buildCellIndex(grid: GridPayload): CellLookupIndex {
  const minX = Math.min(...grid.x_m);
  const minY = Math.min(...grid.y_m);
  const maxX = Math.max(...grid.x_m);
  const maxY = Math.max(...grid.y_m);
  const cellSize = grid.cell_size_m;
  const cols = Math.round((maxX - minX) / cellSize) + 1;
  const rows = Math.round((maxY - minY) / cellSize) + 1;
  const byRowCol = new Map<string, number>();
  for (let i = 0; i < grid.cell_id.length; i++) {
    const col = grid.col?.[i] ?? Math.round((grid.x_m[i]! - minX) / cellSize);
    const row = grid.row?.[i] ?? Math.round((grid.y_m[i]! - minY) / cellSize);
    byRowCol.set(`${row},${col}`, i);
  }
  return { minX, minY, cols, rows, cellSize, byRowCol };
}

export function gridIndexAtUtmLoose(
  grid: GridPayload,
  index: CellLookupIndex,
  east: number,
  north: number,
): number | null {
  const col = Math.round((east - index.minX) / index.cellSize);
  const row = Math.round((north - index.minY) / index.cellSize);
  if (col < 0 || row < 0 || col >= index.cols || row >= index.rows) return null;
  const g = index.byRowCol.get(`${row},${col}`);
  return g === undefined ? null : g;
}

export function gridIndexAtUtm(
  grid: GridPayload,
  index: CellLookupIndex,
  east: number,
  north: number,
): number | null {
  const g = gridIndexAtUtmLoose(grid, index, east, north);
  if (g === null) return null;
  if (!grid.active[g]) return null;
  return g;
}

export function scenarioIndexForGridIndex(
  scenario: ScenarioPayload,
  grid: GridPayload,
  gridIndex: number,
): number | null {
  const id = grid.cell_id[gridIndex];
  const i = scenario.cell_id.indexOf(id);
  return i >= 0 ? i : null;
}

function awaitingColorHex(): string {
  const { r, g, b } = AWAITING_CELL_RGB;
  const byte = (v: number) => Math.round(v * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

export function damageHexForScenarioCell(
  scenario: ScenarioPayload,
  grid: GridPayload,
  damage: number[],
  time: number,
  gridIndex: number,
  scenarioIndex: number,
): { hex: string; awaiting: boolean; inactive: boolean } {
  if (!grid.active[gridIndex]) {
    return { hex: '#abb7c0', awaiting: false, inactive: true };
  }
  if (time < scenario.onset_s[scenarioIndex]) {
    return { hex: awaitingColorHex(), awaiting: true, inactive: false };
  }
  const prob = damage[scenarioIndex] ?? 0;
  return {
    hex: probabilityColorHex(prob),
    awaiting: false,
    inactive: false,
  };
}

export function damageHexAtUtm(
  scenario: ScenarioPayload,
  grid: GridPayload,
  index: CellLookupIndex,
  damage: number[],
  time: number,
  east: number,
  north: number,
): { hex: string; gridIndex: number | null; scenarioIndex: number | null } {
  const g = gridIndexAtUtmLoose(grid, index, east, north);
  if (g === null) {
    return { hex: NO_ACTIVE_CELL_COLOR, gridIndex: null, scenarioIndex: null };
  }
  if (!grid.active[g]) {
    return { hex: NO_ACTIVE_CELL_COLOR, gridIndex: null, scenarioIndex: null };
  }
  const si = scenarioIndexForGridIndex(scenario, grid, g);
  if (si === null) {
    return { hex: NO_ACTIVE_CELL_COLOR, gridIndex: g, scenarioIndex: null };
  }
  const { hex } = damageHexForScenarioCell(
    scenario,
    grid,
    damage,
    time,
    g,
    si,
  );
  return { hex, gridIndex: g, scenarioIndex: si };
}

/** Centroid of a polygon ring in lon/lat. */
export function ringCentroidLonLat(
  ring: [number, number][],
): [number, number] | null {
  if (!ring.length) return null;
  let lon = 0;
  let lat = 0;
  let n = 0;
  for (const p of ring) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    lon += p[0];
    lat += p[1];
    n += 1;
  }
  if (n === 0) return null;
  return [lon / n, lat / n];
}

export function featureCentroidLonLat(
  geometry: GeoJSON.Geometry | null | undefined,
): [number, number] | null {
  if (!geometry) return null;
  if (geometry.type === 'Point') {
    return geometry.coordinates as [number, number];
  }
  if (geometry.type === 'Polygon') {
    return ringCentroidLonLat(geometry.coordinates[0] as [number, number][]);
  }
  if (geometry.type === 'MultiPolygon') {
    const allPoints: [number, number][] = [];
    for (const poly of geometry.coordinates) {
      const ring = poly[0];
      if (!ring) continue;
      for (const p of ring) {
        if (Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) {
          allPoints.push(p as [number, number]);
        }
      }
    }
    return allPoints.length ? ringCentroidLonLat(allPoints) : null;
  }
  return null;
}