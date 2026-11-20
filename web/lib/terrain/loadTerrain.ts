import type { GridPayload } from '@/lib/payload/types';
import { loadThreeGeo, type ThreeGeoInstance } from '@/lib/map/loadThreeGeo';
import {
  type TerrainRequest,
  TILE_CAP,
  zoomForTileCount,
} from '@/lib/terrain/coverage';
import { warpPositionBuffer } from '@/lib/terrain/warp';

export type TerrainStatus = 'absent' | 'failed' | 'ready';

export interface TerrainLoadResult {
  status: TerrainStatus;
  group?: import('@/types/three-vendor').ThreeVendor;
}

const cache = new Map<string, Promise<TerrainLoadResult>>();

export function terrainCacheKey(request: TerrainRequest, token: string): string {
  return `${request.latDeg.toFixed(5)}|${request.lonDeg.toFixed(5)}|${request.radiusKm}|${request.zoom}|${token ? 'token' : 'none'}`;
}

export function decideTerrain(token: string | undefined): TerrainStatus {
  return token?.trim() ? 'ready' : 'absent';
}

function warpGroup(
  group: import('@/types/three-vendor').ThreeVendor,
  tgeo: ThreeGeoInstance,
  origin: [number, number],
  radiusKm: number,
  grid: GridPayload,
): void {
  const { bbox, unitsPerMeter } = tgeo.getProjection(origin, radiusKm, 1.0);
  for (const child of group.children as import('@/types/three-vendor').ThreeVendor[]) {
    const geom = child.geometry;
    const pos = geom?.attributes?.position;
    if (!pos?.array) continue;
    warpPositionBuffer(pos.array, bbox, 1, unitsPerMeter, grid);
    pos.needsUpdate = true;
    geom.computeBoundingSphere?.();
  }
  group.name = 'terrain-basemap';
}

async function buildTerrain(
  grid: GridPayload,
  request: TerrainRequest,
  token: string,
): Promise<TerrainLoadResult> {
  await loadThreeGeo();
  if (!window.ThreeGeo) return { status: 'failed' };

  const origin: [number, number] = [request.latDeg, request.lonDeg];
  const tgeo = new window.ThreeGeo({ tokenMapbox: token });

  let zoom = request.zoom;
  let group = await tgeo.getTerrainRgb(origin, request.radiusKm, zoom);
  if (!group?.children?.length) return { status: 'failed' };

  if (group.children.length > TILE_CAP) {
    zoom = zoomForTileCount(zoom, group.children.length);
    group = await tgeo.getTerrainRgb(origin, request.radiusKm, zoom);
    if (!group?.children?.length) return { status: 'failed' };
  }

  warpGroup(group, tgeo, origin, request.radiusKm, grid);
  return { status: 'ready', group };
}

export function loadTerrain(
  grid: GridPayload,
  request: TerrainRequest,
  token: string | undefined,
): Promise<TerrainLoadResult> {
  const status = decideTerrain(token);
  if (status === 'absent') {
    return Promise.resolve({ status: 'absent' });
  }

  const key = terrainCacheKey(request, token!);
  let pending = cache.get(key);
  if (!pending) {
    pending = buildTerrain(grid, request, token!).catch(() => ({ status: 'failed' as const }));
    cache.set(key, pending);
  }
  return pending;
}

export function cloneTerrainGroup(
  group: import('@/types/three-vendor').ThreeVendor,
): import('@/types/three-vendor').ThreeVendor {
  return group.clone(true);
}