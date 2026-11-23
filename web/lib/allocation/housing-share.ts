import type { MembershipRow, PresentationPayload, ScenarioPayload } from '@/lib/payload/types';

const TOL = 1e-8;

export function hasMembership(payload: PresentationPayload | null | undefined): boolean {
  return Boolean(payload?.membership?.rows?.length);
}

export function membershipDisabledReason(payload: PresentationPayload | null | undefined): string | null {
  if (!payload) return 'Load a presentation payload to enable city focus.';
  if (hasMembership(payload)) return null;
  return 'City focus requires exported cell–LGU housing membership. This payload has saved NCR and LGU totals only.';
}

export function membershipRowsForLgu(
  payload: PresentationPayload,
  adm3_pcode: string,
): MembershipRow[] {
  const rows = payload.membership?.rows ?? [];
  return rows.filter((r) => r.adm3_pcode === adm3_pcode);
}

export function membershipRowsForCell(
  payload: PresentationPayload,
  cell_id: number,
): MembershipRow[] {
  const rows = payload.membership?.rows ?? [];
  return rows.filter((r) => r.cell_id === cell_id);
}

/** Active scenario cell indices attributed to an LGU (housing share > 0 or geometric intersection). */
export function scenarioCellIndicesForLgu(
  payload: PresentationPayload,
  scenario: ScenarioPayload,
  adm3_pcode: string,
  requireHousingShare = false,
): number[] {
  if (!hasMembership(payload)) return [];
  const byCell = new Map<number, MembershipRow[]>();
  for (const row of membershipRowsForLgu(payload, adm3_pcode)) {
    const list = byCell.get(row.cell_id) ?? [];
    list.push(row);
    byCell.set(row.cell_id, list);
  }
  const indices: number[] = [];
  scenario.cell_id.forEach((cellId, i) => {
    const rows = byCell.get(cellId);
    if (!rows?.length) return;
    const share = rows.reduce((acc, r) => acc + r.housing_share, 0);
    const intersects = rows.some((r) => r.geometric_intersection);
    if (requireHousingShare ? share > TOL : share > TOL || intersects) {
      indices.push(i);
    }
  });
  return indices;
}

export function housingShareInCell(
  payload: PresentationPayload,
  cell_id: number,
  adm3_pcode: string,
): number {
  const row = membershipRowsForCell(payload, cell_id).find((r) => r.adm3_pcode === adm3_pcode);
  return row?.housing_share ?? 0;
}

export function lguRow(
  scenario: ScenarioPayload,
  adm3_pcode: string,
): (typeof scenario.lgu)[number] | undefined {
  return scenario.lgu.find((r) => r.adm3_pcode === adm3_pcode);
}