import { describe, expect, it } from 'vitest';
import { projectXY } from '@/lib/display/projection';
import type { GridPayload } from '@/lib/payload/types';
import { utm51nForward } from '@/lib/terrain/utm51n';
import { bboxInverse, warpPositionBuffer } from './warp';

describe('warp', () => {
  it('bboxInverse at center is the bbox midpoint', () => {
    const bbox: [number, number, number, number] = [120.5, 14.0, 121.5, 15.0];
    const [lng, lat] = bboxInverse(0, 0, bbox, 1);
    expect(lng).toBeCloseTo(121.0, 6);
    expect(lat).toBeCloseTo(14.5, 6);
  });

  it('warps the Pasig centre to grid origin and elevation to z km', () => {
    const east = 292088.421;
    const north = 1612754.668;
    const grid: GridPayload = {
      cell_size_m: 500,
      cell_id: [1],
      x_m: [east],
      y_m: [north],
      active: [true],
      population: [100],
      row: [0],
      col: [0],
    };
    const [lon, lat] = [121.07011, 14.58];
    const [fx, fy] = utm51nForward(lon, lat);
    expect(Math.hypot(fx - east, fy - north)).toBeLessThan(0.05);

    const bbox: [number, number, number, number] = [lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5];
    const unitsPerMeter = 0.001;
    const buf = new Float32Array([0, 0, 100 * unitsPerMeter]);
    warpPositionBuffer(buf, bbox, 1, unitsPerMeter, grid);
    expect(Math.abs(buf[0]!)).toBeLessThan(0.001);
    expect(Math.abs(buf[1]!)).toBeLessThan(0.001);
    expect(buf[2]!).toBeCloseTo(projectXY(grid, east, north, 100).z, 4);
  });
});