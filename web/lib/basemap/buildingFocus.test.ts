import { describe, expect, it } from 'vitest';

import { gridBoundsLonLat } from '@/lib/basemap/geojsonOverlays';
import {
  BUILDING_COLOR_MIN_ZOOM,
  BUILDING_FOCUS_ZOOM,
  REGION_LOCKED_BEARING,
  REGION_LOCKED_PITCH,
} from '@/lib/basemap/maplibreConfig';
import type { GridPayload, ScenarioPayload } from '@/lib/payload/types';
import { utm51nInverse } from '@/lib/terrain/utm51n';

import { buildingFocusCamera, fitRegionView, lguFocusZoomFromBoundsFit } from './regionMapLayers';

const epicenter: [number, number] = [292088.421, 1612754.668];

const testGrid = (): GridPayload => ({
  cell_size_m: 500,
  cell_id: [101, 102],
  x_m: [292088.421, 293588.421],
  y_m: [1612754.668, 1614754.668],
  active: [true, true],
  population: [10, 20],
  row: [0, 0],
  col: [0, 1],
});

describe('building focus camera', () => {
  it('frames the assumed epicenter at zoom 14.5', () => {
    const scenario = { epicenter_xy_m: epicenter } as ScenarioPayload;
    const camera = buildingFocusCamera(scenario);
    const [lon, lat] = utm51nInverse(epicenter[0], epicenter[1]);

    expect(camera.zoom).toBe(BUILDING_FOCUS_ZOOM);
    expect(camera.zoom).toBe(14.5);
    expect(camera.zoom).toBeGreaterThanOrEqual(BUILDING_COLOR_MIN_ZOOM);
    expect(camera.center[0]).toBeCloseTo(lon, 6);
    expect(camera.center[1]).toBeCloseTo(lat, 6);
    expect(camera.pitch).toBe(REGION_LOCKED_PITCH);
    expect(camera.bearing).toBe(REGION_LOCKED_BEARING);
  });

  it('raises wide LGU bounds fits to building focus zoom', () => {
    expect(lguFocusZoomFromBoundsFit(10.2)).toBe(BUILDING_FOCUS_ZOOM);
    expect(lguFocusZoomFromBoundsFit(13.4)).toBe(14.75);
    expect(lguFocusZoomFromBoundsFit(13.8)).toBe(15);
    expect(lguFocusZoomFromBoundsFit(10.2)).toBeGreaterThanOrEqual(BUILDING_COLOR_MIN_ZOOM);
  });

  it('reset still fits the supplied grid bounds', () => {
    const bounds = gridBoundsLonLat(testGrid());
    const calls: { bounds: typeof bounds; padding: number; duration: number }[] = [];
    const map = {
      fitBounds: (
        next: typeof bounds,
        options: { padding: number; pitch: number; bearing: number; duration: number },
      ) => {
        calls.push({ bounds: next, padding: options.padding, duration: options.duration });
        expect(options.pitch).toBe(REGION_LOCKED_PITCH);
        expect(options.bearing).toBe(REGION_LOCKED_BEARING);
      },
    };

    fitRegionView(map as unknown as Parameters<typeof fitRegionView>[0], bounds);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.bounds).toEqual(bounds);
    expect(calls[0]?.padding).toBe(40);
    expect(calls[0]?.duration).toBe(0);
    expect(bounds[1][0] - bounds[0][0]).toBeGreaterThan(0);
    expect(bounds[1][1] - bounds[0][1]).toBeGreaterThan(0);
  });
});
