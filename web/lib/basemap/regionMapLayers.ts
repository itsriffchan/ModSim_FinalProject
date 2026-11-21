import type { Map } from 'maplibre-gl';

import {
  ARRIVAL_EDGE_COLOR,
  ARRIVAL_EDGE_LAYER_ID,
  BUILDING_DAMAGE_LAYER_ID,
  EPICENTER_LAYER_ID,
  FAULT_LINE_LAYER_ID,
  GRID_CELL_LAYER_ID,
  LGU_LINE_LAYER_ID,
  NO_ACTIVE_CELL_COLOR,
  REGION_LOCKED_BEARING,
  REGION_LOCKED_PITCH,
} from '@/lib/basemap/maplibreConfig';
import {
  arrivalEdgesGeoJson,
  gridCellOutlinesGeoJson,
  GRID_STROKE_PAINT,
} from '@/lib/basemap/gridCellOutlines';
import {
  epicenterGeoJson,
  faultGeoJson,
  lguOutlinesGeoJson,
} from '@/lib/basemap/geojsonOverlays';
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

export function hideBaseExtrusions(map: Map): void {
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.type === 'fill-extrusion' && layer.id !== BUILDING_DAMAGE_LAYER_ID) {
      try {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      } catch {
        /* */
      }
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
      'fill-extrusion-opacity': 0.92,
    },
  });
}

export function addModsimOverlaySources(
  map: Map,
  overlays: OverlaysPayload,
  scenario: ScenarioPayload,
  grid: GridPayload,
  time: number,
): void {
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

  updateGridOutlines(map, grid, scenario, time);
}

export function updateGridOutlines(
  map: Map,
  grid: GridPayload,
  scenario: ScenarioPayload,
  time: number,
): void {
  const cells = gridCellOutlinesGeoJson(grid, scenario, time);
  const arrival = arrivalEdgesGeoJson(grid, scenario, time);

  if (!map.getSource('modsim-grid-cells')) {
    map.addSource('modsim-grid-cells', { type: 'geojson', data: cells });
    map.addLayer({
      id: GRID_CELL_LAYER_ID,
      type: 'line',
      source: 'modsim-grid-cells',
      paint: {
        'line-color': [
          'match',
          ['get', 'stroke'],
          'inactive',
          GRID_STROKE_PAINT.inactive,
          'awaiting',
          GRID_STROKE_PAINT.awaiting,
          'arrived',
          GRID_STROKE_PAINT.arrived,
          GRID_STROKE_PAINT.inactive,
        ],
        'line-width': 1.5,
      },
    });
  } else {
    (map.getSource('modsim-grid-cells') as import('maplibre-gl').GeoJSONSource).setData(cells);
  }

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

export function applyLockedRegionCamera(map: Map): void {
  map.setPitch(REGION_LOCKED_PITCH);
  map.setBearing(REGION_LOCKED_BEARING);
  map.setMaxPitch(REGION_LOCKED_PITCH);
  map.setMinPitch(REGION_LOCKED_PITCH);
  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
}

export function isStyleLoadError(e: { error?: { message?: string } | null }): boolean {
  const msg = e.error?.message?.toLowerCase() ?? '';
  return msg.includes('style') || msg.includes('sprite') || msg.includes('glyph');
}

export type RegionBasemapMode = 'vector' | 'local';