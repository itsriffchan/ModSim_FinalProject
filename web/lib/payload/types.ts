/** Schema 1 presentation payload (display-only; scientific values come from MATLAB export). */

export type DatasetKey = 'comparison' | 'A' | 'B' | 'C';

export type ScenarioViewId = DatasetKey | 'all';

export interface CrsPayload {
  epsg: number;
  name: string;
  units: string;
  ellipsoid: { a: number; inv_f: number };
  utm: {
    zone: number;
    lon0_deg: number;
    k0: number;
    false_easting_m: number;
    false_northing_m: number;
  };
}

export interface GridPayload {
  cell_size_m: number;
  cell_id: number[];
  x_m: number[];
  y_m: number[];
  active: boolean[];
  population: number[];
  row: number[];
  col: number[];
}

export interface TimingPayload {
  formula: string;
  disclaimer: string;
  playback_speed: number;
  wave_arrival: Record<string, unknown>;
}

export interface EncodingPayload {
  probability_limits: [number, number];
  height_max_km: number;
  height_label: string;
  probability_ticks: number[];
  overflow_label: string;
  progression_label: string;
  arrival_boundary: string;
}

export interface LguRow {
  adm3_pcode: string;
  lgu_name: string;
  population_2020: number;
  occupied_housing_units: number;
  expected_heavily_damaged_units: number;
  expected_moderately_damaged_units: number;
  expected_deaths: number;
  expected_injuries: number;
  deaths_per_1000_residents: number;
  injuries_per_1000_residents: number;
}

export interface ScenarioReference {
  times_s: number[];
  damage_first_cell: number[];
  counters: [number, number][];
}

export interface ScenarioSettings {
  id?: string;
  epicenter?: string;
  duration_s?: number;
  [key: string]: unknown;
}

export interface ScenarioPayload {
  id: string;
  settings: ScenarioSettings;
  duration_s: number;
  horizon_s: number;
  cell_id: number[];
  onset_s: number[];
  pgv_cm_s: number[];
  final_heavy: number[];
  final_losses: [number, number][];
  lgu: LguRow[];
  totals: [number, number];
  epicenter_xy_m: [number, number];
  reference: ScenarioReference;
}

export interface LguOverlay {
  pcode: string;
  name: string;
  xy_m: [number, number][] | (number | null)[][];
}

export interface OverlaysPayload {
  lgu: LguOverlay[];
  fault_xy_m: number[][];
}

/** Optional cell–LGU housing-share metadata (MATLAB export only; not recalculated in the browser). */
export interface MembershipRow {
  cell_id: number;
  adm3_pcode: string;
  occupied_housing_units: number;
  housing_share: number;
  geometric_intersection: boolean;
}

export interface MembershipPayload {
  method: 'occupied_housing_unit_share';
  /** Provenance path or label from the exporter. */
  source: string;
  rows: MembershipRow[];
}

export interface PresentationPayload {
  schema_version: 1;
  crs: CrsPayload;
  grid: GridPayload;
  timing: TimingPayload;
  encoding: EncodingPayload;
  provenance: Record<string, unknown>;
  overlays: OverlaysPayload;
  scenarios: ScenarioPayload | ScenarioPayload[];
  horizon_s: number;
  membership?: MembershipPayload;
}

export interface DataSyncManifest {
  schema: string;
  version: number;
  run_id: string;
  run_root: string;
  synced_utc: string;
  link_mode: 'junction' | 'symlink';
  payloads: Record<
    DatasetKey,
    { source: string; target: string; sha256: string }
  >;
  scientific: { path: string; sha256: string }[];
}