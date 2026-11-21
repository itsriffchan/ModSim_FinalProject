import type { GridPayload, OverlaysPayload, ScenarioPayload } from '@/lib/payload/types';
import { utm51nInverse } from '@/lib/terrain/utm51n';

function lineUtmToLonLat(
  xy: (number | null)[][] | number[][],
): GeoJSON.Position[] {
  const out: GeoJSON.Position[] = [];
  for (const pt of xy) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const x = pt[0];
    const y = pt[1];
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      out.push([NaN, NaN]);
      continue;
    }
    const [lon, lat] = utm51nInverse(x, y);
    out.push([lon, lat]);
  }
  return out;
}

export function faultGeoJson(
  overlays: OverlaysPayload,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'West Valley Fault' },
        geometry: {
          type: 'LineString',
          coordinates: lineUtmToLonLat(overlays.fault_xy_m),
        },
      },
    ],
  };
}

export function epicenterGeoJson(
  scenario: ScenarioPayload,
): GeoJSON.FeatureCollection {
  const [x, y] = scenario.epicenter_xy_m;
  const [lon, lat] = utm51nInverse(x, y);
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Epicenter' },
        geometry: { type: 'Point', coordinates: [lon, lat] },
      },
    ],
  };
}

export function lguOutlinesGeoJson(
  overlays: OverlaysPayload,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: overlays.lgu.map((lgu) => ({
      type: 'Feature' as const,
      properties: { name: lgu.name, pcode: lgu.pcode },
      geometry: {
        type: 'LineString' as const,
        coordinates: lineUtmToLonLat(lgu.xy_m),
      },
    })),
  };
}

export function gridBoundsLonLat(grid: GridPayload): [[number, number], [number, number]] {
  const corners = [
    [Math.min(...grid.x_m), Math.min(...grid.y_m)],
    [Math.max(...grid.x_m), Math.max(...grid.y_m)],
  ] as const;
  const sw = utm51nInverse(corners[0][0], corners[0][1]);
  const ne = utm51nInverse(corners[1][0], corners[1][1]);
  return [
    [Math.min(sw[0], ne[0]), Math.min(sw[1], ne[1])],
    [Math.max(sw[0], ne[0]), Math.max(sw[1], ne[1])],
  ];
}