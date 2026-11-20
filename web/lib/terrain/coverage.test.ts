import { describe, expect, it } from 'vitest';
import type { GridPayload } from '@/lib/payload/types';
import {
  cityCoverage,
  gridCenterLatLon,
  regionCoverage,
  zoomForTileCount,
} from './coverage';

const pasigGrid = (): GridPayload => ({
  cell_size_m: 500,
  cell_id: [1],
  x_m: [292088.421],
  y_m: [1612754.668],
  active: [true],
  population: [100],
  row: [0],
  col: [0],
});

describe('coverage', () => {
  it('lowers zoom when tile count exceeds cap', () => {
    expect(zoomForTileCount(11, 25)).toBe(10);
    expect(zoomForTileCount(10, 25)).toBe(10);
  });

  it('region coverage uses floor radius and zoom 11', () => {
    const req = regionCoverage(pasigGrid());
    expect(req.zoom).toBe(11);
    expect(req.radiusKm).toBeGreaterThanOrEqual(40);
  });

  it('grid center inverse is near Pasig test point', () => {
    const [lon, lat] = gridCenterLatLon(pasigGrid());
    expect(Math.abs(lon - 121.07011)).toBeLessThan(1e-5);
    expect(Math.abs(lat - 14.58)).toBeLessThan(1e-5);
  });

  it('city coverage clamps radius', () => {
    const xy = [
      [292000, 1612700],
      [292500, 1613200],
    ];
    const req = cityCoverage(pasigGrid(), xy);
    expect(req.zoom).toBe(13);
    expect(req.radiusKm).toBeGreaterThanOrEqual(6);
    expect(req.radiusKm).toBeLessThanOrEqual(18);
  });
});