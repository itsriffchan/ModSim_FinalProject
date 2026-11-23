import type { GridPayload, ScenarioPayload } from '@/lib/payload/types';

export interface ArrivalEdge {
  i: number;
  j: number;
  points: [number, number][];
}

/**
 * Shared active-cell edges where a neighbor exists in the same scenario (viewer.js).
 */
export function buildArrivalEdges(
  grid: GridPayload,
  scenario: ScenarioPayload,
): ArrivalEdge[] {
  const index = new Map(grid.cell_id.map((id, i) => [id, i]));
  const local = new Map(scenario.cell_id.map((id, i) => [id, i]));
  const positions = new Map(
    grid.cell_id.map((id, i) => [`${grid.row[i]},${grid.col[i]}`, i]),
  );
  const half = grid.cell_size_m / 2;
  const edges: ArrivalEdge[] = [];

  scenario.cell_id.forEach((id, i) => {
    const g = index.get(id);
    if (g === undefined) return;
    const x = grid.x_m[g];
    const y = grid.y_m[g];
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
    ] as const) {
      const n = positions.get(`${grid.row[g] + dr},${grid.col[g] + dc}`);
      if (n === undefined) continue;
      const neighborId = grid.cell_id[n];
      if (!local.has(neighborId)) continue;
      const nx = grid.x_m[n];
      const ny = grid.y_m[n];
      const points: [number, number][] =
        nx !== x
          ? [
              [(x + nx) / 2, y - half],
              [(x + nx) / 2, y + half],
            ]
          : [
              [x - half, (y + ny) / 2],
              [x + half, (y + ny) / 2],
            ];
      edges.push({ i, j: local.get(neighborId)!, points });
    }
  });

  return edges;
}

export function arrivalBoundarySegmentIndices(
  edges: ArrivalEdge[],
  onset_s: number[],
  time: number,
): number[] {
  const active: number[] = [];
  for (let e = 0; e < edges.length; e++) {
    const edge = edges[e];
    if ((time >= onset_s[edge.i]) !== (time >= onset_s[edge.j])) {
      active.push(e);
    }
  }
  return active;
}