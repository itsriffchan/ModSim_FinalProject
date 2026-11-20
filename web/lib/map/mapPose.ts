export interface MapPose {
  polar: number;
  azimuth: number;
  distance: number;
  targetX: number;
  targetY: number;
  orthoZoom: number;
}

export const DEFAULT_MAP_POSE: MapPose = {
  polar: Math.PI / 2,
  azimuth: 0,
  distance: 80,
  targetX: 0,
  targetY: 0,
  orthoZoom: 1,
};

export function posesEqual(a: MapPose, b: MapPose, eps = 1e-3): boolean {
  return (
    Math.abs(a.polar - b.polar) < eps &&
    Math.abs(a.azimuth - b.azimuth) < eps &&
    Math.abs(a.distance - b.distance) < eps &&
    Math.abs(a.targetX - b.targetX) < eps &&
    Math.abs(a.targetY - b.targetY) < eps &&
    Math.abs(a.orthoZoom - b.orthoZoom) < eps
  );
}