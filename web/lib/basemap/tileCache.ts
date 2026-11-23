import { OSM_TILE_URL, tileCacheKey as keyFromParts } from '@/lib/basemap/osmTiles';

export type BasemapLoadStatus = 'ready' | 'partial' | 'failed';

export type TileLoader = (url: string, key: string) => Promise<HTMLImageElement>;

export interface TileCache {
  get(key: string): Promise<HTMLImageElement>;
  clear(): void;
}

export function osmTileUrl(z: number, x: number, y: number): string {
  return OSM_TILE_URL.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}

export function createTileCache(loader: TileLoader): TileCache {
  const cache = new Map<string, Promise<HTMLImageElement>>();

  return {
    get(key) {
      let pending = cache.get(key);
      if (!pending) {
        const { z, x, y } = parseTileKey(key);
        const url = osmTileUrl(z, x, y);
        pending = loader(url, key).catch((err) => {
          cache.delete(key);
          throw err;
        });
        cache.set(key, pending);
      }
      return pending;
    },
    clear() {
      cache.clear();
    },
  };
}

export function parseTileKey(key: string): { z: number; x: number; y: number } {
  const [zs, xs, ys] = key.split('/');
  return { z: Number(zs), x: Number(xs), y: Number(ys) };
}

function browserTileLoader(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Tile load failed: ${url}`));
    img.src = url;
  });
}

let sharedBrowserCache: TileCache | null = null;

export function getBrowserTileCache(): TileCache {
  if (!sharedBrowserCache) {
    sharedBrowserCache = createTileCache((url) => browserTileLoader(url));
  }
  return sharedBrowserCache;
}

export function loadOsmTile(cache: TileCache, z: number, x: number, y: number): Promise<HTMLImageElement> {
  return cache.get(keyFromParts(z, x, y));
}

export function basemapStatus(
  total: number,
  fulfilled: number,
  rejected: number,
): BasemapLoadStatus {
  if (total === 0) return 'failed';
  if (rejected === total) return 'failed';
  if (fulfilled === total) return 'ready';
  if (fulfilled > 0) return 'partial';
  return 'failed';
}