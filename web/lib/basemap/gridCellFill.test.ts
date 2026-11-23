import { describe, expect, it } from 'vitest';

import { lguBoundsLonLat } from '@/lib/basemap/geojsonOverlays';
import { gridCellPresentation, quantizeProbability } from '@/lib/basemap/gridCellFill';
import { probabilityColorHex } from '@/lib/display/colors';
import { displayState } from '@/lib/display/state';
import type { GridPayload, OverlaysPayload, ScenarioPayload } from '@/lib/payload/types';

const grid = (): GridPayload => ({
  cell_size_m: 500,
  cell_id: [101, 102, 103],
  x_m: [292000, 292500, 293000],
  y_m: [1612000, 1612000, 1612000],
  active: [true, true, false],
  population: [10, 20, 0],
  row: [0, 0, 0],
  col: [0, 1, 2],
});

const scenario = (): ScenarioPayload =>
  ({
    id: 'A',
    duration_s: 20,
    cell_id: [101, 102],
    onset_s: [5, 0],
    final_heavy: [0.05, 0],
    final_losses: [
      [1, 2],
      [0, 0],
    ],
  }) as ScenarioPayload;

describe('grid cell choropleth', () => {
  it('quantizes probability to half-percentage steps', () => {
    expect(quantizeProbability(0.024)).toBe(0.025);
    expect(quantizeProbability(0)).toBe(0);
    expect(quantizeProbability(Number.NaN)).toBe(0);
  });

  it('keeps awaiting, arrived-zero, and inactive fills distinct at the origin', () => {
    const painted = gridCellPresentation(grid(), scenario(), displayState(scenario(), 0).damage, 0);
    const awaiting = painted.find((cell) => cell.cellId === 101);
    const arrivedZero = painted.find((cell) => cell.cellId === 102);
    const inactive = painted.find((cell) => cell.cellId === 103);

    expect(awaiting?.role).toBe('awaiting');
    expect(arrivedZero?.role).toBe('arrived');
    expect(arrivedZero?.fill).toBe(probabilityColorHex(0));
    expect(awaiting?.fill).not.toBe(arrivedZero?.fill);
    expect(inactive?.role).toBe('inactive');
    expect(inactive?.fill).not.toBe(arrivedZero?.fill);
  });

  it('uses the saved display interpolation after onset', () => {
    const at = displayState(scenario(), 15);
    expect(at.damage[0]).toBeCloseTo(0.025);
    const painted = gridCellPresentation(grid(), scenario(), at.damage, 15);
    expect(painted.find((cell) => cell.cellId === 101)?.fill).toBe(probabilityColorHex(0.025));
  });
});

describe('LGU frame bounds', () => {
  it('pads a saved ring and rejects an unknown code', () => {
    const overlays = {
      fault_xy_m: [],
      lgu: [
        {
          pcode: 'X',
          name: 'Test',
          xy_m: [
            [292000, 1612000],
            [293000, 1612000],
            [293000, 1613000],
            [292000, 1613000],
          ],
        },
      ],
    } as OverlaysPayload;
    const bounds = lguBoundsLonLat(overlays, 'X');
    expect(bounds).not.toBeNull();
    expect(bounds![1][0]).toBeGreaterThan(bounds![0][0]);
    expect(bounds![1][1]).toBeGreaterThan(bounds![0][1]);
    expect(lguBoundsLonLat(overlays, 'missing')).toBeNull();
  });
});
