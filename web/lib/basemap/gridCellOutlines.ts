import {
  ARRIVAL_EDGE_COLOR,
  GRID_OUTLINE_ARRIVED,
  GRID_OUTLINE_AWAITING,
  GRID_OUTLINE_INACTIVE,
} from '@/lib/basemap/maplibreConfig';
import {
  arrivalBoundarySegmentIndices,
  buildArrivalEdges,
} from '@/lib/display/arrivalEdges';
import type { GridPayload, ScenarioPayload } from '@/lib/payload/types';
import { utm51nInverse } from '@/lib/terrain/utm51n';

export type GridCellStroke = 'inactive' | 'awaiting' | 'arrived';

export function cellRingLonLat(
  x_m: number,
  y_m: number,
  half: number,
): GeoJSON.Position[] {
  const corners: [number, number][] = [
    [x_m - half, y_m - half],
    [x_m + half, y_m - half],
    [x_m + half, y_m + half],
    [x_m - half, y_m + half],
    [x_m - half, y_m - half],
  ];
  return corners.map(([e, n]) => {
    const [lon, lat] = utm51nInverse(e, n);
    return [lon, lat];
  });
}

export function strokeForCell(
  grid: GridPayload,
  scenario: ScenarioPayload,
  time: number,
  gridIndex: number,
): GridCellStroke | null {
  if (!grid.active[gridIndex]) return 'inactive';
  const id = grid.cell_id[gridIndex];
  const si = scenario.cell_id.indexOf(id);
  if (si < 0) return null;
  if (time < scenario.onset_s[si]) return 'awaiting';
  return 'arrived';
}

export function gridCellOutlinesGeoJson(
  grid: GridPayload,
  scenario: ScenarioPayload,
  time: number,
): GeoJSON.FeatureCollection {
  const half = grid.cell_size_m / 2;
  const features: GeoJSON.Feature[] = [];

  for (let gi = 0; gi < grid.cell_id.length; gi++) {
    const stroke = strokeForCell(grid, scenario, time, gi);
    if (!stroke) continue;
    const x = grid.x_m[gi]!;
    const y = grid.y_m[gi]!;
    features.push({
      type: 'Feature',
      properties: { stroke },
      geometry: {
        type: 'LineString',
        coordinates: cellRingLonLat(x, y, half),
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export function arrivalEdgesGeoJson(
  grid: GridPayload,
  scenario: ScenarioPayload,
  time: number,
): GeoJSON.FeatureCollection {
  const edges = buildArrivalEdges(grid, scenario);
  const active = new Set(arrivalBoundarySegmentIndices(edges, scenario.onset_s, time));
  const features: GeoJSON.Feature[] = [];

  edges.forEach((edge, idx) => {
    if (!active.has(idx)) return;
    const coords = edge.points.map(([e, n]) => {
      const [lon, lat] = utm51nInverse(e, n);
      return [lon, lat] as GeoJSON.Position;
    });
    features.push({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    });
  });

  return { type: 'FeatureCollection', features };
}

export const GRID_STROKE_PAINT: Record<GridCellStroke, string> = {
  inactive: GRID_OUTLINE_INACTIVE,
  awaiting: GRID_OUTLINE_AWAITING,
  arrived: GRID_OUTLINE_ARRIVED,
};

export { ARRIVAL_EDGE_COLOR };