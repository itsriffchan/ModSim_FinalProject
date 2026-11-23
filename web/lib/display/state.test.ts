import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { normalizeScenarios } from '@/lib/payload/load';
import { validatePresentationPayload } from '@/lib/payload/validate';
import type { ScenarioPayload } from '@/lib/payload/types';
import { displayState } from './state';

const TOL = 1e-8;
const rootDir = path.dirname(fileURLToPath(import.meta.url));

const EMBEDDED_A_REFERENCE = {
  duration_s: 20,
  times: [0, 3.5717271807288156, 8.222653829088218, 18.222653829088216, 29],
  damage_first_cell: [0, 0, 0, 0.020187459896830916, 0.04037491979366184],
  counters: [
    [0, 0],
    [0, 0],
    [800.6249482749336, 8986.661582329558],
    [3099.9209308980876, 34726.661392341455],
    [4598.591965246282, 51479.99962002392],
  ] as [number, number][],
};

function near(actual: number, expected: number): void {
  expect(Math.abs(actual - expected)).toBeLessThan(TOL);
}

function loadIndependentA(): ScenarioPayload | null {
  const payloadPath = path.resolve(rootDir, '../../public/data/A/presentation_payload.json');
  if (!fs.existsSync(payloadPath)) return null;
  const raw = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  const payload = validatePresentationPayload(raw);
  return normalizeScenarios(payload)[0];
}

describe('displayState', () => {
  it('returns zero damage and counts at t=0', () => {
    const scenario = loadIndependentA();
    if (!scenario) {
      const stub: ScenarioPayload = {
        id: 'A',
        settings: {},
        duration_s: 20,
        horizon_s: 29,
        cell_id: [1],
        onset_s: [5],
        pgv_cm_s: [10],
        final_heavy: [0.05],
        final_losses: [[1, 2]],
        lgu: Array.from({ length: 17 }, (_, i) => ({
          adm3_pcode: `PH${i}`,
          lgu_name: `LGU ${i}`,
          population_2020: 1,
          occupied_housing_units: 1,
          expected_heavily_damaged_units: 0,
          expected_moderately_damaged_units: 0,
          expected_deaths: 0,
          expected_injuries: 0,
          deaths_per_1000_residents: 0,
          injuries_per_1000_residents: 0,
        })),
        totals: [1, 2],
        epicenter_xy_m: [0, 0],
        reference: { times_s: [0], damage_first_cell: [0], counters: [[0, 0]] },
      };
      const atZero = displayState(stub, 0);
      expect(atZero.damage[0]).toBe(0);
      expect(atZero.counts).toEqual([0, 0]);
      return;
    }
    const atZero = displayState(scenario, 0);
    expect(atZero.damage.every((d) => d === 0)).toBe(true);
    expect(atZero.counts).toEqual([0, 0]);
  });

  it('matches saved MATLAB reference samples when payload A is synced', () => {
    const scenario = loadIndependentA();
    if (!scenario) return;

    const { reference } = scenario;
    for (let k = 0; k < reference.times_s.length; k++) {
      const t = reference.times_s[k];
      const out = displayState(scenario, t);
      near(out.damage[0], reference.damage_first_cell[k]);
      near(out.counts[0], reference.counters[k][0]);
      near(out.counts[1], reference.counters[k][1]);
    }
  });

  it('matches embedded first-cell reference slice from independent A export', () => {
    const scenario = loadIndependentA();
    if (!scenario) return;

    for (let k = 0; k < EMBEDDED_A_REFERENCE.times.length; k++) {
      const t = EMBEDDED_A_REFERENCE.times[k];
      const out = displayState(scenario, t);
      near(out.damage[0], EMBEDDED_A_REFERENCE.damage_first_cell[k]);
      near(out.counts[0], EMBEDDED_A_REFERENCE.counters[k][0]);
      near(out.counts[1], EMBEDDED_A_REFERENCE.counters[k][1]);
    }
  });
});