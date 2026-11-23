import { describe, expect, it } from 'vitest';

import {
  hasMembership,
  housingShareInCell,
  membershipDisabledReason,
  scenarioCellIndicesForLgu,
} from '@/lib/allocation/housing-share';
import type { PresentationPayload } from '@/lib/payload/types';

const basePayload = {
  schema_version: 1 as const,
  horizon_s: 40,
  grid: {
    cell_size_m: 500,
    cell_id: [1, 2],
    x_m: [0, 500],
    y_m: [0, 0],
    active: [true, true],
    population: [100, 200],
    row: [0, 0],
    col: [0, 1],
  },
  timing: { formula: '', disclaimer: '', playback_speed: 2, wave_arrival: {} },
  encoding: {
    probability_limits: [0, 0.1] as [number, number],
    height_max_km: 0,
    height_label: '',
    probability_ticks: [0, 0.1],
    overflow_label: '>=10%',
    progression_label: '',
    arrival_boundary: '',
  },
  provenance: {},
  overlays: { lgu: [], fault_xy_m: [] },
  crs: {
    epsg: 32651,
    name: 'WGS 84 / UTM zone 51N',
    units: 'm',
    ellipsoid: { a: 6378137, inv_f: 298.257223563 },
    utm: { zone: 51, lon0_deg: 123, k0: 0.9996, false_easting_m: 500000, false_northing_m: 0 },
  },
};

describe('housing-share', () => {
  it('disables focus without membership', () => {
    const payload = { ...basePayload, scenarios: [] } as unknown as PresentationPayload;
    expect(hasMembership(payload)).toBe(false);
    expect(membershipDisabledReason(payload)).toMatch(/housing membership/);
  });

  it('attributes cells by housing share', () => {
    const scenario = {
      id: 'A',
      settings: {},
      duration_s: 20,
      horizon_s: 40,
      cell_id: [1, 2],
      onset_s: [0, 0],
      pgv_cm_s: [1, 1],
      final_heavy: [0.01, 0.02],
      final_losses: [
        [1, 2],
        [3, 4],
      ] as [number, number][],
      lgu: Array.from({ length: 17 }, (_, i) => ({
        adm3_pcode: `P${i}`,
        lgu_name: `LGU ${i}`,
        population_2020: 0,
        occupied_housing_units: 0,
        expected_heavily_damaged_units: 0,
        expected_moderately_damaged_units: 0,
        expected_deaths: 0,
        expected_injuries: 0,
        deaths_per_1000_residents: 0,
        injuries_per_1000_residents: 0,
      })),
      totals: [4, 6] as [number, number],
      epicenter_xy_m: [0, 0] as [number, number],
      reference: { times_s: [0], damage_first_cell: [0], counters: [[0, 0] as [number, number]] },
    };
    const payload: PresentationPayload = {
      ...basePayload,
      scenarios: scenario,
      membership: {
        method: 'occupied_housing_unit_share',
        source: 'test',
        rows: [
          {
            cell_id: 1,
            adm3_pcode: 'PX',
            occupied_housing_units: 30,
            housing_share: 1,
            geometric_intersection: true,
          },
          {
            cell_id: 2,
            adm3_pcode: 'PX',
            occupied_housing_units: 15,
            housing_share: 0.5,
            geometric_intersection: true,
          },
          {
            cell_id: 2,
            adm3_pcode: 'PY',
            occupied_housing_units: 15,
            housing_share: 0.5,
            geometric_intersection: true,
          },
        ],
      },
    };
    scenario.lgu[0].adm3_pcode = 'PX';
    const indices = scenarioCellIndicesForLgu(payload, scenario, 'PX');
    expect(indices).toEqual([0, 1]);
    expect(housingShareInCell(payload, 2, 'PX')).toBeCloseTo(0.5);
  });
});