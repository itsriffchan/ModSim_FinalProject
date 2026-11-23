import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';

import { damageHexForScenarioCell } from '@/lib/basemap/buildingDamage';
import { arrivalEdgesGeoJson, GRID_STROKE_PAINT } from '@/lib/basemap/gridCellOutlines';
import {
  ARRIVAL_EDGE_LAYER_ID,
  EPICENTER_LAYER_ID,
  FAULT_LINE_LAYER_ID,
  GRID_CELL_LAYER_ID,
  GRID_CELL_SOURCE_ID,
  GRID_FILL_LAYER_ID,
  GRID_FILL_SOURCE_ID,
  LGU_LINE_LAYER_ID,
} from '@/lib/basemap/maplibreConfig';
import { NCR_BORDER_LAYER_ID } from '@/lib/map/ncrCamera';
import {
  arrivalBoundarySegmentIndices,
  buildArrivalEdges,
  type ArrivalEdge,
} from '@/lib/display/arrivalEdges';
import { clipRectToRings, ncrClipIndex, type Pt } from '@/lib/basemap/clipGridToNcr';
import type { GridPayload, OverlaysPayload, ScenarioPayload } from '@/lib/payload/types';
import { utm51nInverse } from '@/lib/terrain/utm51n';

export type CellFillRole = 'inactive' | 'awaiting' | 'arrived';

export interface CellPresentation {
  cellId: number;
  fill: string;
  stroke: string;
  role: CellFillRole;
}

const INACTIVE_FILL = '#abb7c0';

/** Bucket displayed probability so playback repaints a cell only when the color step changes. */
export function quantizeProbability(p: number): number {
  if (!Number.isFinite(p) || p <= 0) return 0;
  return Math.round(p * 200) / 200;
}

export function gridCellPresentation(
  grid: GridPayload,
  scenario: ScenarioPayload,
  damage: number[],
  time: number,
): CellPresentation[] {
  const scenarioIndex = new Map<number, number>();
  scenario.cell_id.forEach((id, index) => {
    scenarioIndex.set(id, index);
  });
  const quantized = damage.map((value) => quantizeProbability(value));
  const cells: CellPresentation[] = [];

  for (let gridIndex = 0; gridIndex < grid.cell_id.length; gridIndex++) {
    const cellId = grid.cell_id[gridIndex]!;
    const scenarioCell = scenarioIndex.get(cellId);
    if (!grid.active[gridIndex] || scenarioCell == null) {
      cells.push({
        cellId,
        fill: INACTIVE_FILL,
        stroke: GRID_STROKE_PAINT.inactive,
        role: 'inactive',
      });
      continue;
    }
    const painted = damageHexForScenarioCell(
      scenario,
      grid,
      quantized,
      time,
      gridIndex,
      scenarioCell,
    );
    const role: CellFillRole = painted.inactive
      ? 'inactive'
      : painted.awaiting
        ? 'awaiting'
        : 'arrived';
    const stroke =
      role === 'awaiting'
        ? GRID_STROKE_PAINT.awaiting
        : role === 'arrived'
          ? GRID_STROKE_PAINT.arrived
          : GRID_STROKE_PAINT.inactive;
    cells.push({ cellId, fill: painted.hex, stroke, role });
  }

  return cells;
}

function closeRing(coords: GeoJSON.Position[]): GeoJSON.Position[] {
  if (coords.length === 0) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return coords;
  return [...coords, first];
}

function meterRingToLonLat(ring: Pt[]): GeoJSON.Position[] {
  return closeRing(ring.map(([east, north]) => utm51nInverse(east, north)));
}

interface ClippedGeometry {
  fill: GeoJSON.FeatureCollection;
  lines: GeoJSON.FeatureCollection;
}

const clippedGeometryCache = new WeakMap<OverlaysPayload, WeakMap<GridPayload, ClippedGeometry>>();

function clippedGeometry(grid: GridPayload, overlays: OverlaysPayload): ClippedGeometry {
  const byGrid = clippedGeometryCache.get(overlays) ?? new WeakMap<GridPayload, ClippedGeometry>();
  if (!clippedGeometryCache.has(overlays)) clippedGeometryCache.set(overlays, byGrid);
  const cached = byGrid.get(grid);
  if (cached) return cached;

  const half = grid.cell_size_m / 2;
  const clip = ncrClipIndex(overlays);
  const fill: GeoJSON.Feature[] = [];
  const lines: GeoJSON.Feature[] = [];
  for (let gridIndex = 0; gridIndex < grid.cell_id.length; gridIndex++) {
    const x = grid.x_m[gridIndex];
    const y = grid.y_m[gridIndex];
    if (typeof x !== 'number' || typeof y !== 'number') continue;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const cellId = grid.cell_id[gridIndex]!;
    const pieces = clip
      ? clipRectToRings(
          { minX: x - half, minY: y - half, maxX: x + half, maxY: y + half },
          clip.rings,
          clip.index,
        )
      : ([[
          [x - half, y - half],
          [x + half, y - half],
          [x + half, y + half],
          [x - half, y + half],
        ]] as Pt[][]);
    if (pieces.length === 0) continue;
    const polygons = pieces.map((ring) => [meterRingToLonLat(ring)]);
    const outlines = pieces.map((ring) => meterRingToLonLat(ring));
    fill.push({
      type: 'Feature',
      id: cellId,
      properties: { cell_id: cellId },
      geometry:
        polygons.length === 1
          ? { type: 'Polygon', coordinates: polygons[0] }
          : { type: 'MultiPolygon', coordinates: polygons },
    });
    lines.push({
      type: 'Feature',
      id: cellId,
      properties: { cell_id: cellId },
      geometry:
        outlines.length === 1
          ? { type: 'LineString', coordinates: outlines[0] }
          : { type: 'MultiLineString', coordinates: outlines },
    });
  }
  const geometry = {
    fill: { type: 'FeatureCollection' as const, features: fill },
    lines: { type: 'FeatureCollection' as const, features: lines },
  };
  byGrid.set(grid, geometry);
  return geometry;
}

/** Static cell squares, cut to the saved NCR outline. Color is feature state. */
export function ensureGridGeometry(
  map: MapLibreMap,
  grid: GridPayload,
  overlays: OverlaysPayload,
): void {
  const geometry = clippedGeometry(grid, overlays);
  if (!map.getSource(GRID_FILL_SOURCE_ID)) {
    map.addSource(GRID_FILL_SOURCE_ID, {
      type: 'geojson',
      data: geometry.fill,
      promoteId: 'cell_id',
    });
    map.addLayer({
      id: GRID_FILL_LAYER_ID,
      type: 'fill',
      source: GRID_FILL_SOURCE_ID,
      paint: {
        'fill-color': ['coalesce', ['feature-state', 'fill'], '#e3e5df'],
        'fill-opacity': ['case', ['==', ['feature-state', 'dim'], 1], 0.18, 0.8],
      },
    });
  }

  if (!map.getSource(GRID_CELL_SOURCE_ID)) {
    map.addSource(GRID_CELL_SOURCE_ID, {
      type: 'geojson',
      data: geometry.lines,
      promoteId: 'cell_id',
    });
    map.addLayer({
      id: GRID_CELL_LAYER_ID,
      type: 'line',
      source: GRID_CELL_SOURCE_ID,
      paint: {
        'line-color': ['coalesce', ['feature-state', 'stroke'], GRID_STROKE_PAINT.awaiting],
        'line-width': 1.15,
      },
    });
  }
}

export interface GridPaintCache {
  scenarioId: string;
  keyByCell: Map<number, string>;
  arrivalKey: string;
  edges: ArrivalEdge[] | null;
}

export function emptyGridPaintCache(): GridPaintCache {
  return {
    scenarioId: '',
    keyByCell: new Map(),
    arrivalKey: '',
    edges: null,
  };
}

export function paintGridCells(
  map: MapLibreMap,
  grid: GridPayload,
  scenario: ScenarioPayload,
  damage: number[],
  time: number,
  cache: GridPaintCache,
  highlightIds: Set<number> | null,
): { arrived: number; checksum: number } {
  if (cache.scenarioId !== scenario.id) {
    cache.scenarioId = scenario.id;
    cache.keyByCell.clear();
    cache.arrivalKey = '';
    cache.edges = null;
  }

  if (!map.getSource(GRID_FILL_SOURCE_ID)) {
    return { arrived: 0, checksum: 0 };
  }

  const cells = gridCellPresentation(grid, scenario, damage, time);
  let arrived = 0;
  let checksum = 0;
  const outlinesReady = Boolean(map.getSource(GRID_CELL_SOURCE_ID));

  for (const cell of cells) {
    const dim = highlightIds && !highlightIds.has(cell.cellId) ? 1 : 0;
    const key = `${cell.fill}|${cell.stroke}|${dim}`;
    for (let i = 0; i < cell.fill.length; i++) {
      checksum = Math.imul(checksum ^ cell.fill.charCodeAt(i) ^ (dim + 1), 16777619);
    }
    if (cell.role === 'arrived') arrived += 1;
    if (cache.keyByCell.get(cell.cellId) === key) continue;
    cache.keyByCell.set(cell.cellId, key);
    map.setFeatureState(
      { source: GRID_FILL_SOURCE_ID, id: cell.cellId },
      { fill: cell.fill, dim },
    );
    if (outlinesReady) {
      map.setFeatureState(
        { source: GRID_CELL_SOURCE_ID, id: cell.cellId },
        { stroke: cell.stroke },
      );
    }
  }

  if (!cache.edges) cache.edges = buildArrivalEdges(grid, scenario);
  const active = arrivalBoundarySegmentIndices(cache.edges, scenario.onset_s, time);
  let arrivalKey = String(active.length);
  for (const index of active) arrivalKey += `:${index}`;
  if (arrivalKey !== cache.arrivalKey && map.getSource('modsim-arrival-edges')) {
    cache.arrivalKey = arrivalKey;
    const source = map.getSource('modsim-arrival-edges') as GeoJSONSource;
    source.setData(arrivalEdgesGeoJson(grid, scenario, time));
  }

  return { arrived, checksum };
}

export function raiseScenarioLines(map: MapLibreMap): void {
  const aboveBuildings = [
    GRID_CELL_LAYER_ID,
    ARRIVAL_EDGE_LAYER_ID,
    LGU_LINE_LAYER_ID,
    FAULT_LINE_LAYER_ID,
    EPICENTER_LAYER_ID,
    NCR_BORDER_LAYER_ID,
  ];
  for (const id of aboveBuildings) {
    if (map.getLayer(id)) map.moveLayer(id);
  }
}
