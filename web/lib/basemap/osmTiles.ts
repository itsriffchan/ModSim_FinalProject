import { gridCenterM, projectXY } from '@/lib/display/projection';
import type { GridPayload } from '@/lib/payload/types';
import { utm51nForward, utm51nInverse } from '@/lib/terrain/utm51n';

export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

export const TILE_SEGMENTS = 8;
export const CONTEXT_ZOOM = 11;
export const DETAIL_ZOOM = 12;
export const CITY_MAX_TILES = 36;
export const CITY_MAX_ZOOM = 15;

export interface BasemapLayer {
  z: number;
  zKm: number;
  tiles: { x: number; y: number }[];
}

export interface TileGeometryData {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
}

function lonLatToTileY(latDeg: number, z: number): number {
  const n = 2 ** z;
  const latRad = (latDeg * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
}

export function lonLatToTile(lonDeg: number, latDeg: number, z: number): [number, number] {
  const n = 2 ** z;
  const x = Math.floor(((lonDeg + 180) / 360) * n);
  const y = lonLatToTileY(latDeg, z);
  return [x, y];
}

/** NW corner of tile (x, y) in fractional tile coordinates. */
export function tileToLonLat(tx: number, ty: number, z: number): [number, number] {
  const n = 2 ** z;
  const lon = (tx / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * ty) / n))) * 180) / Math.PI;
  return [lon, lat];
}

export function tileToLonLatAtPixel(
  tileX: number,
  tileY: number,
  fracX: number,
  fracY: number,
  z: number,
): [number, number] {
  return tileToLonLat(tileX + fracX, tileY + fracY, z);
}

export interface TileRange {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function tileRange(
  west: number,
  south: number,
  east: number,
  north: number,
  z: number,
): TileRange {
  const n = 2 ** z;
  const minX = Math.floor(((west + 180) / 360) * n);
  const maxX = Math.floor(((east + 180) / 360) * n);
  const yNorth = lonLatToTileY(north, z);
  const ySouth = lonLatToTileY(south, z);
  return {
    minX: Math.min(minX, maxX),
    maxX: Math.max(minX, maxX),
    minY: Math.min(yNorth, ySouth),
    maxY: Math.max(yNorth, ySouth),
  };
}

export function tilesInRange(range: TileRange): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let x = range.minX; x <= range.maxX; x++) {
    for (let y = range.minY; y <= range.maxY; y++) {
      out.push({ x, y });
    }
  }
  return out;
}

export function tileCountInRange(range: TileRange): number {
  return (range.maxX - range.minX + 1) * (range.maxY - range.minY + 1);
}

function boundsLonLat(
  westM: number,
  southM: number,
  eastM: number,
  northM: number,
): [number, number, number, number] {
  const [wLon, sLat] = utm51nInverse(westM, southM);
  const [eLon, nLat] = utm51nInverse(eastM, northM);
  const west = Math.min(wLon, eLon);
  const east = Math.max(wLon, eLon);
  const south = Math.min(sLat, nLat);
  const north = Math.max(sLat, nLat);
  return [west, south, east, north];
}

function gridMetersBounds(grid: GridPayload): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  return {
    minX: Math.min(...grid.x_m),
    maxX: Math.max(...grid.x_m),
    minY: Math.min(...grid.y_m),
    maxY: Math.max(...grid.y_m),
  };
}

function contextSquareBounds(grid: GridPayload): [number, number, number, number] {
  const [cx, cy] = gridCenterM(grid);
  const b = gridMetersBounds(grid);
  const spanX = b.maxX - b.minX;
  const spanY = b.maxY - b.minY;
  const half = Math.max(spanX, spanY) / 2;
  return [cx - half, cy - half, cx + half, cy + half];
}

function padBounds(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  fraction: number,
): [number, number, number, number] {
  const dx = (maxX - minX) * fraction;
  const dy = (maxY - minY) * fraction;
  return [minX - dx, minY - dy, maxX + dx, maxY + dy];
}

function finiteFocusPairs(xy: (number | null)[][] | undefined): number[][] {
  if (!xy?.length) return [];
  return xy.filter(
    (p): p is [number, number] =>
      Array.isArray(p) &&
      typeof p[0] === 'number' &&
      typeof p[1] === 'number' &&
      Number.isFinite(p[0]) &&
      Number.isFinite(p[1]),
  );
}

function focusMeterBounds(pairs: number[][]): [number, number, number, number] {
  const xs = pairs.map((p) => p[0]!);
  const ys = pairs.map((p) => p[1]!);
  return [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  ];
}

function layerFromMeters(
  minXm: number,
  minYm: number,
  maxXm: number,
  maxYm: number,
  z: number,
  zKm: number,
): BasemapLayer {
  const [west, south, east, north] = boundsLonLat(minXm, minYm, maxXm, maxYm);
  const range = tileRange(west, south, east, north, z);
  return { z, zKm, tiles: tilesInRange(range) };
}

export function basemapLayers(
  grid: GridPayload,
  focusXyM?: (number | null)[][],
): BasemapLayer[] {
  const layers: BasemapLayer[] = [];

  const [cMinX, cMinY, cMaxX, cMaxY] = contextSquareBounds(grid);
  layers.push(layerFromMeters(cMinX, cMinY, cMaxX, cMaxY, CONTEXT_ZOOM, -0.12));

  const b = gridMetersBounds(grid);
  const [dMinX, dMinY, dMaxX, dMaxY] = padBounds(b.minX, b.minY, b.maxX, b.maxY, 0.1);
  layers.push(layerFromMeters(dMinX, dMinY, dMaxX, dMaxY, DETAIL_ZOOM, -0.11));

  const pairs = finiteFocusPairs(focusXyM);
  if (pairs.length > 0) {
    const [fMinX, fMinY, fMaxX, fMaxY] = focusMeterBounds(pairs);
    const [pMinX, pMinY, pMaxX, pMaxY] = padBounds(fMinX, fMinY, fMaxX, fMaxY, 0.15);
    let chosenZ = CITY_MAX_ZOOM;
    for (let z = CITY_MAX_ZOOM; z >= 10; z--) {
      const [west, south, east, north] = boundsLonLat(pMinX, pMinY, pMaxX, pMaxY);
      const count = tileCountInRange(tileRange(west, south, east, north, z));
      if (count <= CITY_MAX_TILES) {
        chosenZ = z;
        break;
      }
    }
    layers.push(layerFromMeters(pMinX, pMinY, pMaxX, pMaxY, chosenZ, -0.1));
  }

  return layers;
}

export function tileGeometry(
  grid: GridPayload,
  z: number,
  tileX: number,
  tileY: number,
  segments = TILE_SEGMENTS,
): TileGeometryData {
  const vertCount = (segments + 1) * (segments + 1);
  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  let vi = 0;
  for (let row = 0; row <= segments; row++) {
    const fracY = row / segments;
    for (let col = 0; col <= segments; col++) {
      const fracX = col / segments;
      const [lon, lat] = tileToLonLatAtPixel(tileX, tileY, fracX, fracY, z);
      const [east, north] = utm51nForward(lon, lat);
      const v = projectXY(grid, east, north, 0);
      const i3 = vi * 3;
      positions[i3] = v.x;
      positions[i3 + 1] = v.y;
      positions[i3 + 2] = v.z;
      const i2 = vi * 2;
      uvs[i2] = fracX;
      uvs[i2 + 1] = 1 - fracY;
      vi++;
    }
  }

  const quadCount = segments * segments;
  const indices = new Uint16Array(quadCount * 6);
  let ii = 0;
  for (let row = 0; row < segments; row++) {
    for (let col = 0; col < segments; col++) {
      const a = row * (segments + 1) + col;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;
      indices[ii++] = a;
      indices[ii++] = c;
      indices[ii++] = b;
      indices[ii++] = b;
      indices[ii++] = c;
      indices[ii++] = d;
    }
  }

  return { positions, uvs, indices };
}

export function tileCacheKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

export function allTileKeys(layers: BasemapLayer[]): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const layer of layers) {
    for (const t of layer.tiles) {
      const k = tileCacheKey(layer.z, t.x, t.y);
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
      }
    }
  }
  return keys;
}

export function ncrAcceptanceGrid(): GridPayload {
  return {
    cell_size_m: 500,
    cell_id: [1],
    x_m: [274750, 299250],
    y_m: [1587750, 1635750],
    active: [true, true],
    population: [1, 1],
    row: [0, 1],
    col: [0, 1],
  };
}

/** Position in projected km at lon/lat. */
export function projectLonLat(grid: GridPayload, lon: number, lat: number): { x: number; y: number } {
  const [east, north] = utm51nForward(lon, lat);
  const v = projectXY(grid, east, north, 0);
  return { x: v.x, y: v.y };
}