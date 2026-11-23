import type { Map } from 'maplibre-gl';

import {
  ARRIVAL_EDGE_COLOR,
  ARRIVAL_EDGE_LAYER_ID,
  BUILDING_COLOR_MIN_ZOOM,
  BUILDING_DAMAGE_LAYER_ID,
  BUILDING_FOCUS_ZOOM,
  EPICENTER_LAYER_ID,
  FAULT_LINE_LAYER_ID,
  LGU_LINE_LAYER_ID,
  NO_ACTIVE_CELL_COLOR,
  REGION_LOCKED_BEARING,
  REGION_LOCKED_PITCH,
} from '@/lib/basemap/maplibreConfig';
import { utm51nInverse } from '@/lib/terrain/utm51n';
import { ensureGridGeometry } from '@/lib/basemap/gridCellFill';
import { arrivalEdgesGeoJson } from '@/lib/basemap/gridCellOutlines';
import {
  epicenterGeoJson,
  faultGeoJson,
  lguOutlinesGeoJson,
  ncrBorderGeoJson,
} from '@/lib/basemap/geojsonOverlays';
import {
  NCR_BORDER_COLOR,
  NCR_BORDER_LAYER_ID,
  NCR_DRAG_PAN,
  NCR_TRACKPAD_ZOOM_RATE,
  NCR_WHEEL_ZOOM_RATE,
  type LngLatBoundsPair,
} from '@/lib/map/ncrCamera';
import type { GridPayload, OverlaysPayload, ScenarioPayload } from '@/lib/payload/types';

export function findVectorSourceWithBuilding(map: Map): string | null {
  const style = map.getStyle();
  for (const layer of style.layers ?? []) {
    const sourceLayer = (layer as { 'source-layer'?: string })['source-layer'];
    if (sourceLayer !== 'building') continue;
    if (!('source' in layer) || typeof layer.source !== 'string') continue;
    const src = style.sources?.[layer.source];
    if (src && typeof src === 'object' && 'type' in src && src.type === 'vector') {
      return layer.source;
    }
  }
  return null;
}

export function styleHasBuildingLayer(map: Map, vectorId: string | null): boolean {
  if (!vectorId) return false;
  return (map.getStyle().layers ?? []).some((layer) => {
    const spec = layer as { source?: string; 'source-layer'?: string };
    return spec.source === vectorId && spec['source-layer'] === 'building';
  });
}

export function hideBaseBuildingLayers(map: Map): void {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.id === BUILDING_DAMAGE_LAYER_ID) continue;
    const sourceLayer = (layer as { 'source-layer'?: string })['source-layer'];
    if (sourceLayer !== 'building') continue;
    try {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    } catch {
      /* layer may not accept layout yet */
    }
  }
}

export function addBuildingDamageLayer(map: Map, vectorId: string): void {
  if (map.getLayer(BUILDING_DAMAGE_LAYER_ID)) return;
  map.addLayer({
    id: BUILDING_DAMAGE_LAYER_ID,
    type: 'fill-extrusion',
    source: vectorId,
    'source-layer': 'building',
    minzoom: BUILDING_COLOR_MIN_ZOOM,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-extrusion-color': [
        'coalesce',
        ['feature-state', 'damage'],
        NO_ACTIVE_CELL_COLOR,
      ],
      'fill-extrusion-height': [
        'coalesce',
        ['get', 'render_height'],
        ['get', 'height'],
        12,
      ],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 1,
    },
  });
}

export interface BuildingFocusCamera {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

/** Neighborhood frame on the assumed epicenter. Reset still uses grid bounds. */
export function buildingFocusCamera(scenario: ScenarioPayload): BuildingFocusCamera {
  const [x, y] = scenario.epicenter_xy_m;
  const [lon, lat] = utm51nInverse(x, y);
  return {
    center: [lon, lat],
    zoom: BUILDING_FOCUS_ZOOM,
    pitch: REGION_LOCKED_PITCH,
    bearing: REGION_LOCKED_BEARING,
  };
}

/** LGU frames must reach vector building tiles (min zoom 13) at the locked pitch. */
export function lguFocusZoomFromBoundsFit(fitZoom: number): number {
  const stepped = fitZoom + 1.35;
  return Math.min(15, Math.max(stepped, BUILDING_FOCUS_ZOOM));
}

export function addModsimOverlaySources(
  map: Map,
  overlays: OverlaysPayload,
  scenario: ScenarioPayload,
  grid: GridPayload,
  time: number,
): void {
  updateGridOutlines(map, grid, scenario, time, overlays);

  const fault = faultGeoJson(overlays);
  if (!map.getSource('modsim-fault')) {
    map.addSource('modsim-fault', { type: 'geojson', data: fault });
    map.addLayer({
      id: FAULT_LINE_LAYER_ID,
      type: 'line',
      source: 'modsim-fault',
      paint: { 'line-color': '#a92349', 'line-width': 3 },
    });
  }

  const epicenter = epicenterGeoJson(scenario);
  if (!map.getSource('modsim-epicenter')) {
    map.addSource('modsim-epicenter', { type: 'geojson', data: epicenter });
    map.addLayer({
      id: EPICENTER_LAYER_ID,
      type: 'circle',
      source: 'modsim-epicenter',
      paint: {
        'circle-radius': 10,
        'circle-color': '#ffffff',
        'circle-stroke-color': '#101b27',
        'circle-stroke-width': 3,
      },
    });
  } else {
    (map.getSource('modsim-epicenter') as import('maplibre-gl').GeoJSONSource).setData(epicenter);
  }

  const lgu = lguOutlinesGeoJson(overlays);
  if (!map.getSource('modsim-lgu')) {
    map.addSource('modsim-lgu', { type: 'geojson', data: lgu });
    map.addLayer({
      id: LGU_LINE_LAYER_ID,
      type: 'line',
      source: 'modsim-lgu',
      paint: { 'line-color': '#354d60', 'line-width': 1, 'line-opacity': 0.35 },
    });
  }

  const border = ncrBorderGeoJson(overlays);
  if (!map.getSource('modsim-ncr-border')) {
    map.addSource('modsim-ncr-border', { type: 'geojson', data: border });
    map.addLayer({
      id: NCR_BORDER_LAYER_ID,
      type: 'line',
      source: 'modsim-ncr-border',
      paint: {
        'line-color': NCR_BORDER_COLOR,
        'line-width': 4,
        'line-opacity': 1,
      },
    });
  } else {
    (map.getSource('modsim-ncr-border') as import('maplibre-gl').GeoJSONSource).setData(border);
  }
}

export function updateGridOutlines(
  map: Map,
  grid: GridPayload,
  scenario: ScenarioPayload,
  time: number,
  overlays: OverlaysPayload,
): void {
  ensureGridGeometry(map, grid, overlays);
  const arrival = arrivalEdgesGeoJson(grid, scenario, time);

  if (!map.getSource('modsim-arrival-edges')) {
    map.addSource('modsim-arrival-edges', { type: 'geojson', data: arrival });
    map.addLayer({
      id: ARRIVAL_EDGE_LAYER_ID,
      type: 'line',
      source: 'modsim-arrival-edges',
      paint: { 'line-color': ARRIVAL_EDGE_COLOR, 'line-width': 2.5 },
    });
  } else {
    (map.getSource('modsim-arrival-edges') as import('maplibre-gl').GeoJSONSource).setData(
      arrival,
    );
  }
}

export function fitRegionView(
  map: Map,
  bounds: [[number, number], [number, number]],
): void {
  map.fitBounds(bounds, {
    padding: 40,
    pitch: REGION_LOCKED_PITCH,
    bearing: REGION_LOCKED_BEARING,
    duration: 0,
  });
}

/** Scroll, pinch, double-click, box, and keyboard zoom stay off. Drag pan remains. */
export function disableManualZoom(map: Map): void {
  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();
  map.keyboard.disable();
}

export function releaseMapZoom(map: Map): void {
  map.setMinZoom(0);
  map.setMaxZoom(22);
}

/** Pin min and max to the current zoom so a gesture cannot change it. */
export function freezeMapZoom(map: Map): void {
  const zoom = map.getZoom();
  map.setMinZoom(zoom);
  map.setMaxZoom(zoom);
}

export function applyLockedRegionCamera(map: Map): void {
  map.setPitch(REGION_LOCKED_PITCH);
  map.setBearing(REGION_LOCKED_BEARING);
  map.setMaxPitch(REGION_LOCKED_PITCH);
  map.setMinPitch(REGION_LOCKED_PITCH);
  map.dragRotate.disable();
  map.touchZoomRotate.disable();
  disableManualZoom(map);
}

/** Keep pan inside the padded NCR extent. Manual zoom stays disabled. */
export function applyNcrCameraLimits(map: Map, bounds: LngLatBoundsPair): void {
  map.setRenderWorldCopies(false);
  map.setMaxBounds(bounds);
  map.scrollZoom.setWheelZoomRate(NCR_WHEEL_ZOOM_RATE);
  map.scrollZoom.setZoomRate(NCR_TRACKPAD_ZOOM_RATE);
  map.dragPan.enable({
    linearity: NCR_DRAG_PAN.linearity,
    maxSpeed: NCR_DRAG_PAN.maxSpeed,
    deceleration: NCR_DRAG_PAN.deceleration,
  });
  disableManualZoom(map);
}

export function emphasizeLgu(map: Map, pcode: string | null): void {
  if (!map.getLayer(LGU_LINE_LAYER_ID)) return;
  const selected = pcode ?? '';
  map.setPaintProperty(LGU_LINE_LAYER_ID, 'line-color', [
    'case',
    ['==', ['get', 'pcode'], selected],
    '#1d4e89',
    '#354d60',
  ]);
  map.setPaintProperty(LGU_LINE_LAYER_ID, 'line-width', [
    'case',
    ['==', ['get', 'pcode'], selected],
    2.5,
    1,
  ]);
}

const HOLD_EDGE_PX = 2;
const HOLD_SLOP_DEG = 0.002;

export interface VisibleWindow {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** Geographic window currently on screen. The tilted overview uses this as the pan limit. */
export function visibleWindow(map: Map): VisibleWindow | null {
  const canvas = map.getCanvas();
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width < 2 || height < 2) return null;
  const samples: Array<[number, number]> = [
    [HOLD_EDGE_PX, HOLD_EDGE_PX],
    [width / 2, HOLD_EDGE_PX],
    [width - HOLD_EDGE_PX, HOLD_EDGE_PX],
    [HOLD_EDGE_PX, height / 2],
    [width - HOLD_EDGE_PX, height / 2],
    [HOLD_EDGE_PX, height - HOLD_EDGE_PX],
    [width / 2, height - HOLD_EDGE_PX],
    [width - HOLD_EDGE_PX, height - HOLD_EDGE_PX],
  ];
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [x, y] of samples) {
    const point = map.unproject([x, y]);
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    west = Math.min(west, point.lng);
    east = Math.max(east, point.lng);
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
  }
  if (!Number.isFinite(west) || !Number.isFinite(north)) return null;
  return {
    west: west - HOLD_SLOP_DEG,
    south: south - HOLD_SLOP_DEG,
    east: east + HOLD_SLOP_DEG,
    north: north + HOLD_SLOP_DEG,
  };
}

/**
 * Shift the camera so the on-screen ground stays inside `limit`.
 * Does not zoom: the fitted region stays the wide view, and panning cannot
 * reveal past that frame.
 */
export function holdViewInsideWindow(map: Map, limit: VisibleWindow): void {
  for (let step = 0; step < 6; step++) {
    const seen = visibleWindow(map);
    if (!seen) return;
    const center = map.getCenter();
    let lat = center.lat;
    let lng = center.lng;
    const cap = 0.12;
    const northOver = seen.north - limit.north;
    const southOver = limit.south - seen.south;
    const eastOver = seen.east - limit.east;
    const westOver = limit.west - seen.west;
    if (northOver > 0) lat -= Math.min(northOver, cap);
    else if (southOver > 0) lat += Math.min(southOver, cap);
    if (eastOver > 0) lng -= Math.min(eastOver, cap);
    else if (westOver > 0) lng += Math.min(westOver, cap);
    if (lat === center.lat && lng === center.lng) return;
    map.jumpTo({
      center: [lng, lat],
      pitch: REGION_LOCKED_PITCH,
      bearing: REGION_LOCKED_BEARING,
    });
  }
}

/** Fit the region and return the geographic window that later pans must stay inside. */
export function frameNcrView(map: Map, bounds: LngLatBoundsPair): VisibleWindow | null {
  fitRegionView(map, bounds);
  applyLockedRegionCamera(map);
  const window = visibleWindow(map);
  map.setMinZoom(map.getZoom());
  return window;
}

/** Recompute the zoom-out floor after a resize without pulling a closer view back out. */
export function syncNcrMinZoom(map: Map, bounds: LngLatBoundsPair): VisibleWindow | null {
  const saved = {
    center: map.getCenter(),
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };
  const window = frameNcrView(map, bounds);
  if (saved.zoom > map.getZoom() + 1e-4) {
    map.jumpTo({
      center: saved.center,
      zoom: saved.zoom,
      pitch: REGION_LOCKED_PITCH,
      bearing: REGION_LOCKED_BEARING,
    });
    if (window) holdViewInsideWindow(map, window);
  }
  return window;
}

export function raiseNcrBorder(map: Map): void {
  if (map.getLayer(NCR_BORDER_LAYER_ID)) {
    map.moveLayer(NCR_BORDER_LAYER_ID);
  }
}

export function isStyleLoadError(e: { error?: { message?: string } | null }): boolean {
  const msg = e.error?.message?.toLowerCase() ?? '';
  return msg.includes('style') || msg.includes('sprite') || msg.includes('glyph');
}

export type RegionBasemapMode = 'vector' | 'local';