/** Region-only vector basemap (presentation; not scientific input). */

export const OPENFREEMAP_LIBERTY_STYLE =
  'https://tiles.openfreemap.org/styles/liberty';

export const OPENFREEMAP_ATTRIBUTION =
  '© OpenStreetMap contributors · vector tiles via OpenFreeMap';

/** Locked low camera: 62° from vertical, north-up (MapLibre pitch). */
export const REGION_LOCKED_PITCH = 62;
export const REGION_LOCKED_BEARING = 0;

/** OpenFreeMap `building` tiles start at this zoom. */
export const BUILDING_COLOR_MIN_ZOOM = 13;
/** Neighborhood frame where extruded structures are readable at the locked pitch. */
export const BUILDING_FOCUS_ZOOM = 14.5;

export const BUILDING_DAMAGE_LAYER_ID = 'modsim-building-damage';
export const FAULT_LINE_LAYER_ID = 'modsim-fault';
export const EPICENTER_LAYER_ID = 'modsim-epicenter';
export const LGU_LINE_LAYER_ID = 'modsim-lgu-outline';
export const GRID_FILL_SOURCE_ID = 'modsim-grid-fill';
export const GRID_FILL_LAYER_ID = 'modsim-grid-fill';
export const GRID_CELL_SOURCE_ID = 'modsim-grid-cells';
export const GRID_CELL_LAYER_ID = 'modsim-grid-cells';
export const ARRIVAL_EDGE_LAYER_ID = 'modsim-arrival-edge';

export const NO_ACTIVE_CELL_COLOR = '#d7c4a8';

export const GRID_OUTLINE_INACTIVE = '#abb7c0';
export const GRID_OUTLINE_AWAITING = '#e3e5df';
export const GRID_OUTLINE_ARRIVED = '#4a4038';
export const ARRIVAL_EDGE_COLOR = '#d17a00';

export const REGION_MAP_CAPTION =
  'Grid color is the saved heavy-damage probability spreading from each cell onset. The shared scale saturates at 10%. OpenStreetMap buildings, when a city frame is close enough to include footprints, use that same cell probability at the footprint centroid, not a measured building value. This low view does not preserve equal screen scale.';

/** Minimal style for offline / style-failure Region map (local overlays only). */
export const REGION_LOCAL_BLANK_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'modsim-background',
      type: 'background' as const,
      paint: { 'background-color': '#c5d8e6' },
    },
  ],
};