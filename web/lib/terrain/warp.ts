import { projectXY } from '@/lib/display/projection';
import type { GridPayload } from '@/lib/payload/types';
import { utm51nForward } from '@/lib/terrain/utm51n';

export function bboxInverse(
  x: number,
  y: number,
  bbox: [number, number, number, number],
  unitsSide = 1,
): [lng: number, lat: number] {
  const [west, south, east, north] = bbox;
  const lng = west + (x / unitsSide + 0.5) * (east - west);
  const lat = south - (y / unitsSide + 0.5) * (south - north);
  return [lng, lat];
}

export function warpPositionBuffer(
  array: Float32Array | number[],
  bbox: [number, number, number, number],
  unitsSide: number,
  unitsPerMeter: number,
  grid: GridPayload,
): void {
  for (let i = 0; i < array.length; i += 3) {
    const tx = array[i]!;
    const ty = array[i + 1]!;
    const tz = array[i + 2]!;
    const [lng, lat] = bboxInverse(tx, ty, bbox, unitsSide);
    const [east, north] = utm51nForward(lng, lat);
    const elevM = unitsPerMeter > 0 ? tz / unitsPerMeter : 0;
    const v = projectXY(grid, east, north, elevM);
    array[i] = v.x;
    array[i + 1] = v.y;
    array[i + 2] = v.z;
  }
}