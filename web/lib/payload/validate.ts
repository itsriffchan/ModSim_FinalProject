import type { PresentationPayload, ScenarioPayload } from './types';

const TOL = 1e-8;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertPresent<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) {
    throw new Error(`Missing required field: ${label}`);
  }
  return value;
}

function assertFiniteArray(values: unknown, label: string): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`Expected non-empty numeric array: ${label}`);
  }
  for (let i = 0; i < values.length; i++) {
    if (!isFiniteNumber(values[i])) {
      throw new Error(`Non-finite value in ${label}[${i}]`);
    }
  }
  return values;
}

function validateScenario(s: unknown, label: string): ScenarioPayload {
  if (!s || typeof s !== 'object') {
    throw new Error(`Invalid scenario object: ${label}`);
  }
  const scenario = s as ScenarioPayload;
  assertPresent(scenario.id, `${label}.id`);
  assertFiniteArray(scenario.cell_id, `${label}.cell_id`);
  assertFiniteArray(scenario.onset_s, `${label}.onset_s`);
  assertFiniteArray(scenario.pgv_cm_s, `${label}.pgv_cm_s`);
  assertFiniteArray(scenario.final_heavy, `${label}.final_heavy`);

  if (!isFiniteNumber(scenario.duration_s) || !isFiniteNumber(scenario.horizon_s)) {
    throw new Error(`Invalid scenario timing on ${label}`);
  }

  const n = scenario.cell_id.length;
  for (const field of ['onset_s', 'pgv_cm_s', 'final_heavy'] as const) {
    if (scenario[field].length !== n) {
      throw new Error(`${label}.${field} length ${scenario[field].length} !== ${n} cells`);
    }
  }

  if (!Array.isArray(scenario.final_losses) || scenario.final_losses.length !== n) {
    throw new Error(`${label}.final_losses must have one [deaths, injuries] pair per active cell`);
  }
  for (let i = 0; i < scenario.final_losses.length; i++) {
    const pair = scenario.final_losses[i];
    if (!Array.isArray(pair) || pair.length !== 2) {
      throw new Error(`${label}.final_losses[${i}] must be [deaths, injuries]`);
    }
    if (!isFiniteNumber(pair[0]) || !isFiniteNumber(pair[1])) {
      throw new Error(`${label}.final_losses[${i}] contains non-finite values`);
    }
  }

  if (!Array.isArray(scenario.totals) || scenario.totals.length !== 2) {
    throw new Error(`${label}.totals must be [deaths, injuries]`);
  }
  const sumDeaths = scenario.final_losses.reduce((acc, p) => acc + p[0], 0);
  const sumInjuries = scenario.final_losses.reduce((acc, p) => acc + p[1], 0);
  if (
    Math.abs(sumDeaths - scenario.totals[0]) > TOL ||
    Math.abs(sumInjuries - scenario.totals[1]) > TOL
  ) {
    throw new Error(`${label} totals do not match sum of final_losses`);
  }

  if (!Array.isArray(scenario.lgu) || scenario.lgu.length !== 17) {
    throw new Error(`${label}.lgu must contain 17 LGU rows`);
  }

  assertPresent(scenario.reference, `${label}.reference`);
  return scenario;
}

export function validatePresentationPayload(raw: unknown): PresentationPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Payload must be a JSON object');
  }
  const payload = raw as PresentationPayload;
  if (payload.schema_version !== 1) {
    throw new Error(`Unsupported schema_version ${String(payload.schema_version)}`);
  }

  assertPresent(payload.grid, 'grid');
  assertFiniteArray(payload.grid.cell_id, 'grid.cell_id');
  assertFiniteArray(payload.grid.x_m, 'grid.x_m');
  assertFiniteArray(payload.grid.y_m, 'grid.y_m');
  if (payload.grid.x_m.length !== payload.grid.cell_id.length) {
    throw new Error('grid geometry length mismatch');
  }
  if (!Array.isArray(payload.grid.active) || payload.grid.active.length !== payload.grid.cell_id.length) {
    throw new Error('grid.active must align with grid.cell_id');
  }
  if (!Array.isArray(payload.grid.population) || payload.grid.population.length !== payload.grid.cell_id.length) {
    throw new Error('grid.population must align with grid.cell_id');
  }
  for (let i = 0; i < payload.grid.population.length; i++) {
    if (!isFiniteNumber(payload.grid.population[i])) {
      throw new Error(`grid.population[${i}] is not a finite number`);
    }
  }
  if (!isFiniteNumber(payload.grid.cell_size_m)) {
    throw new Error('grid.cell_size_m must be finite');
  }

  if (!isFiniteNumber(payload.horizon_s)) {
    throw new Error('horizon_s must be finite');
  }

  const scenarios = Array.isArray(payload.scenarios) ? payload.scenarios : [payload.scenarios];
  if (scenarios.length === 0) {
    throw new Error('At least one scenario is required');
  }
  scenarios.forEach((s, i) => validateScenario(s, `scenarios[${i}]`));

  if (!payload.encoding || !Array.isArray(payload.encoding.probability_limits)) {
    throw new Error('encoding.probability_limits missing');
  }

  return payload;
}