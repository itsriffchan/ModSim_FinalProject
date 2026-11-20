import { describe, expect, it } from 'vitest';
import { REGION_ZOOM } from './coverage';
import { decideTerrain, terrainCacheKey } from './loadTerrain';

describe('loadTerrain helpers', () => {
  it('marks empty token as absent', () => {
    expect(decideTerrain('')).toBe('absent');
    expect(decideTerrain(undefined)).toBe('absent');
    expect(decideTerrain('pk.test')).toBe('ready');
  });

  it('builds stable cache keys', () => {
    const req = {
      latDeg: 14.58,
      lonDeg: 121.07,
      radiusKm: 40,
      zoom: REGION_ZOOM,
    };
    const a = terrainCacheKey(req, 'secret');
    const b = terrainCacheKey(req, 'secret');
    const c = terrainCacheKey({ ...req, zoom: 10 }, 'secret');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});