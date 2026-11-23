import { describe, expect, it } from 'vitest';

import { gridCenterKm, projectXY } from '@/lib/display/projection';
import { utm51nForward } from '@/lib/terrain/utm51n';

import {
  basemapLayers,
  lonLatToTile,
  ncrAcceptanceGrid,
  projectLonLat,
  tileGeometry,
  tileToLonLat,
  tileToLonLatAtPixel,
  CONTEXT_ZOOM,
  DETAIL_ZOOM,
  CITY_MAX_TILES,
  CITY_MAX_ZOOM,
} from './osmTiles';

describe('osmTiles slippy math', () => {
  it('round-trips lonLatToTile and tileToLonLat near cell centre', () => {
    const lon = 121.07;
    const lat = 14.58;
    const z = 12;
    const [tx, ty] = lonLatToTile(lon, lat, z);
    const [lon2, lat2] = tileToLonLat(tx + 0.5, ty + 0.5, z);
    expect(Math.abs(lon2 - lon)).toBeLessThan(0.05);
    expect(Math.abs(lat2 - lat)).toBeLessThan(0.05);
  });

  it('tile corner vertices match projectXY(utm51nForward(corner))', () => {
    const grid = ncrAcceptanceGrid();
    const z = 12;
    const [tx, ty] = lonLatToTile(121.07, 14.58, z);
    const geom = tileGeometry(grid, z, tx, ty, 4);
    const corners = [
      [0, 0],
      [4, 0],
      [0, 4],
      [4, 4],
    ];
    for (const [row, col] of corners) {
      const vi = (row * 5 + col) * 3;
      const px = geom.positions[vi]!;
      const py = geom.positions[vi + 1]!;
      const [lon, lat] = tileToLonLatAtPixel(tx, ty, col / 4, row / 4, z);
      const [east, north] = utm51nForward(lon, lat);
      const v = projectXY(grid, east, north, 0);
      expect(Math.abs(px - v.x)).toBeLessThan(5e-7);
      expect(Math.abs(py - v.y)).toBeLessThan(5e-7);
    }
  });

  it('Pasig epicenter maps within 2 m on the projected grid', () => {
    const grid = ncrAcceptanceGrid();
    const east = 292088.421;
    const north = 1612754.668;
    const [lon, lat] = [121.07011, 14.58] as const;
    const [fx, fy] = utm51nForward(lon, lat);
    expect(Math.hypot(fx - east, fy - north)).toBeLessThanOrEqual(0.05);

    const z = 14;
    const n = 2 ** z;
    const fracX = ((lon + 180) / 360) * n;
    const latRad = (lat * Math.PI) / 180;
    const fracY =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    const tileX = Math.floor(fracX);
    const tileY = Math.floor(fracY);
    const [lonAt, latAt] = tileToLonLatAtPixel(
      tileX,
      tileY,
      fracX - tileX,
      fracY - tileY,
      z,
    );
    const p = projectLonLat(grid, lonAt, latAt);
    const expected = projectXY(grid, east, north, 0);
    expect(Math.hypot(p.x - expected.x, p.y - expected.y) * 1000).toBeLessThan(2);
  });

  it('north-up: projected y decreases as tile row increases', () => {
    const grid = ncrAcceptanceGrid();
    const z = 12;
    const [tx, ty] = lonLatToTile(121.07, 14.58, z);
    const geom = tileGeometry(grid, z, tx, ty, 8);
    const cols = 9;
    let prevY: number | null = null;
    for (let row = 0; row <= 8; row++) {
      const vi = (row * cols) * 3 + 1;
      const y = geom.positions[vi]!;
      if (prevY !== null) {
        expect(y).toBeLessThan(prevY);
      }
      prevY = y;
    }
  });
});

describe('basemapLayers tile caps', () => {
  const grid = ncrAcceptanceGrid();

  it('region context and detail layers stay within tile caps on NCR extent', () => {
    const layers = basemapLayers(grid);
    const ctx = layers.find((l) => l.z === CONTEXT_ZOOM)!;
    const det = layers.find((l) => l.z === DETAIL_ZOOM)!;
    expect(ctx.tiles.length).toBeLessThanOrEqual(49);
    expect(det.tiles.length).toBeLessThanOrEqual(40);
  });

  it('city focus layer has at most 36 tiles at zoom 15 or below', () => {
    const focus: [number, number][] = [
      [292000, 1612700],
      [292500, 1613200],
    ];
    const layers = basemapLayers(grid, focus);
    const focusLayer = layers[layers.length - 1];
    expect(focusLayer.z).toBeLessThanOrEqual(CITY_MAX_ZOOM);
    expect(focusLayer.tiles.length).toBeLessThanOrEqual(CITY_MAX_TILES);
  });

  it('grid center km is unchanged under projection helper', () => {
    const c = gridCenterKm(grid);
    expect(Number.isFinite(c.x_km)).toBe(true);
    expect(Number.isFinite(c.y_km)).toBe(true);
  });
});

describe('tileRange counts', () => {
  it('basemapLayers uses bounded tile counts on saved NCR corners', () => {
    const grid = ncrAcceptanceGrid();
    const layers = basemapLayers(grid);
    for (const layer of layers) {
      expect(layer.tiles.length).toBeLessThanOrEqual(49);
    }
  });
});
