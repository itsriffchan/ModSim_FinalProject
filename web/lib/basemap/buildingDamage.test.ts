import { describe, expect, it } from 'vitest';

import { probabilityColorHex } from '@/lib/display/colors';
import type { GridPayload, ScenarioPayload } from '@/lib/payload/types';

import { NO_ACTIVE_CELL_COLOR } from '@/lib/basemap/maplibreConfig';

import {
  buildCellIndex,
  damageHexAtUtm,
  featureCentroidLonLat,
  gridIndexAtUtm,
  scenarioIndexForGridIndex,
} from './buildingDamage';

const testGrid = (): GridPayload => ({
  cell_size_m: 500,
  cell_id: [101, 102],
  x_m: [292088.421, 292588.421],
  y_m: [1612754.668, 1612754.668],
  active: [true, true],
  population: [10, 20],
  row: [0, 0],
  col: [0, 1],
});

const testScenario = (): ScenarioPayload =>
  ({
    id: 'A',
    cell_id: [101, 102],
    onset_s: [5, 5],
    duration_s: [20, 20],
    final_heavy: [0.05, 0.08],
    final_losses: [
      [0, 0],
      [0, 0],
    ],
  }) as unknown as ScenarioPayload;

describe('buildingDamage cell lookup', () => {
  it('resolves Pasig epicenter UTM to grid index 0', () => {
    const grid = testGrid();
    const index = buildCellIndex(grid);
    const g = gridIndexAtUtm(grid, index, 292088.421, 1612754.668);
    expect(g).toBe(0);
  });

  it('maps grid index to scenario cell index', () => {
    const grid = testGrid();
    expect(scenarioIndexForGridIndex(testScenario(), grid, 0)).toBe(0);
  });

  it('uses awaiting color before onset', () => {
    const grid = testGrid();
    const index = buildCellIndex(grid);
    const damage = [0.05, 0.08];
    const { hex } = damageHexAtUtm(
      testScenario(),
      grid,
      index,
      damage,
      0,
      292088.421,
      1612754.668,
    );
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns no-active-cell color off the grid', () => {
    const grid = testGrid();
    const index = buildCellIndex(grid);
    const { hex } = damageHexAtUtm(
      testScenario(),
      grid,
      index,
      [0.05, 0.08],
      10,
      0,
      0,
    );
    expect(hex).toBe(NO_ACTIVE_CELL_COLOR);
  });

  it('multi-polygon centroid uses all outer rings', () => {
    const c = featureCentroidLonLat({
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [121, 14],
            [121.01, 14],
            [121.01, 14.01],
            [121, 14.01],
            [121, 14],
          ],
        ],
        [
          [
            [121.02, 14.02],
            [121.03, 14.02],
            [121.03, 14.03],
            [121.02, 14.03],
            [121.02, 14.02],
          ],
        ],
      ],
    });
    expect(c?.[0]).toBeCloseTo(121.018, 2);
    expect(c?.[1]).toBeCloseTo(14.018, 2);
  });

  it('probability hex matches palette after onset', () => {
    const grid = testGrid();
    const index = buildCellIndex(grid);
    const damage = [0.05, 0.08];
    const { hex } = damageHexAtUtm(
      testScenario(),
      grid,
      index,
      damage,
      10,
      292088.421,
      1612754.668,
    );
    expect(hex).toBe(probabilityColorHex(0.05));
  });
});