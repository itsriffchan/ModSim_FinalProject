import type { GridPayload } from '@/lib/payload/types';

export interface KmCenter {
  x_km: number;
  y_km: number;
}

/** Grid center in meters (viewer.js center). */
export function gridCenterM(grid: GridPayload): [number, number] {
  const minX = Math.min(...grid.x_m);
  const maxX = Math.max(...grid.x_m);
  const minY = Math.min(...grid.y_m);
  const maxY = Math.max(...grid.y_m);
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

export function gridCenterKm(grid: GridPayload): KmCenter {
  const [cx, cy] = gridCenterM(grid);
  return { x_km: cx / 1000, y_km: cy / 1000 };
}

/** North-up km coordinates relative to grid center (viewer.js `xy`). */
export function projectXY(
  grid: GridPayload,
  x_m: number,
  y_m: number,
  z_m = 0,
): { x: number; y: number; z: number } {
  const [cx, cy] = gridCenterM(grid);
  return {
    x: (x_m - cx) / 1000,
    y: (y_m - cy) / 1000,
    z: z_m / 1000,
  };
}