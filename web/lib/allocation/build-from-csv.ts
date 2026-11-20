/**
 * Future client-side loader for `ncr_cell_lgu_housing.csv` + `ncr_cell_lgu.csv`.
 *
 * City focus and housing-share allocation are authoritative only when `membership`
 * is exported by MATLAB (`write_scenario_viewer`). This module documents the
 * grouping rule (sum housing units by cell_id + adm3_pcode, divide by cell total)
 * but does not fetch CSV in the browser yet.
 */

import type { MembershipPayload } from '@/lib/payload/types';

export const CSV_MEMBERSHIP_DISABLED_MESSAGE =
  'Housing-share membership is not embedded in this payload. Re-export with prepared ncr_cell_lgu_housing.csv present, or load membership from the server.';

/** Stub — returns undefined so the UI keeps focus disabled without inventing shares. */
export async function buildMembershipFromCsvFiles(_paths: {
  housingCsv: string;
  intersectionCsv: string;
}): Promise<MembershipPayload | undefined> {
  return undefined;
}