import { gridCenterM } from '@/lib/display/projection';
import type { GridPayload } from '@/lib/payload/types';
import { utm51nInverse } from '@/lib/terrain/utm51n';

export const REGION_RADIUS_FLOOR_KM = 40;
export const REGION_ZOOM = 11;
export const CITY_ZOOM = 13;
export const TILE_CAP = 24;
export const MIN_ZOOM = 10;

export interface TerrainRequest {
  lonDeg: number;
  latDeg: number;
  radiusKm: number;
  zoom: number;
}

function halfDiagonalKm(xs: number[], ys: number[]): number {
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = (maxX - minX) / 1000;
  const dy = (maxY - minY) / 1000;
  return Math.hypot(dx, dy) / 2;
}

function finitePairs(xy: number[][]): number[][] {
  return xy.filter(
    (p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]),
  );
}

export function zoomForTileCount(zoom: number, tileCount: number): number {
  if (tileCount > TILE_CAP && zoom > MIN_ZOOM) return zoom - 1;
  return zoom;
}

export function regionCoverage(grid: GridPayload): TerrainRequest {
  const [cx, cy] = gridCenterM(grid);
  const [lonDeg, latDeg] = utm51nInverse(cx, cy);
  const half = halfDiagonalKm(grid.x_m, grid.y_m);
  const radiusKm = Math.max(half * 1.25, REGION_RADIUS_FLOOR_KM);
  return { lonDeg, latDeg, radiusKm, zoom: REGION_ZOOM };
}

export function cityCoverage(grid: GridPayload, xyM: number[][]): TerrainRequest {
  const pairs = finitePairs(xyM);
  const xs = pairs.map((p) => p[0]!);
  const ys = pairs.map((p) => p[1]!);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  const [lonDeg, latDeg] = utm51nInverse(cx, cy);
  const half = halfDiagonalKm(xs, ys);
  const scaled = half * 1.15;
  const radiusKm = Math.min(18, Math.max(6, scaled));
  return { lonDeg, latDeg, radiusKm, zoom: CITY_ZOOM };
}

export function gridCenterLatLon(grid: GridPayload): [number, number] {
  const [cx, cy] = gridCenterM(grid);
  return utm51nInverse(cx, cy);
}