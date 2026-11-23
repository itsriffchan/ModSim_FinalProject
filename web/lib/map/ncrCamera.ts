import { gridCenterM } from '@/lib/display/projection';
import type { GridPayload, OverlaysPayload } from '@/lib/payload/types';
import { utm51nInverse } from '@/lib/terrain/utm51n';

import { ncrExtentM, padExtent, type ExtentM } from '@/lib/map/ncrBoundary';

export const NCR_CAMERA_PAD_M = 2000;
export const NCR_BORDER_COLOR = '#128a3e';
export const NCR_BORDER_HEX = 0x128a3e;
export const NCR_BORDER_WIDTH_M = 280;
export const NCR_BORDER_LAYER_ID = 'modsim-ncr-border';
export const NCR_WHEEL_ZOOM_RATE = 1 / 900;
export const NCR_TRACKPAD_ZOOM_RATE = 1 / 180;
/**
 * MapLibre's inertia duration divides by linearity, so 0 is not usable.
 * A tiny rate keeps a drag flick from coasting out of the region.
 */
export const NCR_DRAG_PAN = {
  linearity: 1e-4,
  maxSpeed: 700,
  deceleration: 3500,
} as const;
export const NCR_ORBIT_PAN_SPEED = 0.45;
export const NCR_ORBIT_ZOOM_SPEED = 0.55;

export type LngLatBoundsPair = [[number, number], [number, number]];

export interface TargetBoxKm {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function paddedNcrExtent(overlays: OverlaysPayload): ExtentM | null {
  const extent = ncrExtentM(overlays);
  if (!extent) return null;
  return padExtent(extent, NCR_CAMERA_PAD_M);
}

export function extentToLonLatBounds(extent: ExtentM): LngLatBoundsPair {
  const corners = [
    utm51nInverse(extent.minX, extent.minY),
    utm51nInverse(extent.maxX, extent.minY),
    utm51nInverse(extent.minX, extent.maxY),
    utm51nInverse(extent.maxX, extent.maxY),
  ];
  const lons = corners.map((corner) => corner[0]);
  const lats = corners.map((corner) => corner[1]);
  return [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
}

export function paddedNcrBoundsLonLat(overlays: OverlaysPayload): LngLatBoundsPair | null {
  const extent = paddedNcrExtent(overlays);
  if (!extent) return null;
  return extentToLonLatBounds(extent);
}

export function ncrTargetBoxKm(
  grid: Pick<GridPayload, 'x_m' | 'y_m'>,
  overlays: OverlaysPayload,
): TargetBoxKm | null {
  const extent = paddedNcrExtent(overlays);
  if (!extent) return null;
  const [cx, cy] = gridCenterM(grid as GridPayload);
  return {
    minX: (extent.minX - cx) / 1000,
    maxX: (extent.maxX - cx) / 1000,
    minY: (extent.minY - cy) / 1000,
    maxY: (extent.maxY - cy) / 1000,
  };
}

export function clampTarget(
  x: number,
  y: number,
  box: TargetBoxKm,
): { x: number; y: number; dx: number; dy: number } {
  const nx = Math.min(box.maxX, Math.max(box.minX, x));
  const ny = Math.min(box.maxY, Math.max(box.minY, y));
  return { x: nx, y: ny, dx: nx - x, dy: ny - y };
}
