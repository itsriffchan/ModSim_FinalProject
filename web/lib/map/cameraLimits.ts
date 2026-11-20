import type { CameraMode } from '@/lib/store/explorer-store';

/**
 * OrbitControls measures polar angle from +Y (north), not from the map normal.
 * phi = π/2, theta = 0 places the camera on +Z: true top-down, north-up.
 * Tilt increases phi toward π (camera moves south, stays above the XY map).
 * Heading is theta. Limits keep the camera above the map and near north-up,
 * except orbit, which may yaw a full turn but not cross the horizon.
 */
export interface CameraLimit {
  rotate: boolean;
  polarMin: number;
  polarMax: number;
  azimuthMin: number;
  azimuthMax: number;
  /** Polar angle applied when the mode is selected or north is reset. */
  polar: number;
  azimuth: number;
}

const DEG = Math.PI / 180;

export const CAMERA_LIMITS: Record<CameraMode, CameraLimit> = {
  bird: {
    rotate: false,
    polarMin: Math.PI / 2,
    polarMax: Math.PI / 2,
    azimuthMin: 0,
    azimuthMax: 0,
    polar: Math.PI / 2,
    azimuth: 0,
  },
  oblique: {
    rotate: true,
    polarMin: Math.PI / 2 + 22 * DEG,
    polarMax: Math.PI / 2 + 48 * DEG,
    azimuthMin: -20 * DEG,
    azimuthMax: 20 * DEG,
    polar: Math.PI / 2 + 34 * DEG,
    azimuth: 0,
  },
  low: {
    rotate: true,
    polarMin: Math.PI / 2 + 52 * DEG,
    polarMax: Math.PI / 2 + 72 * DEG,
    azimuthMin: -28 * DEG,
    azimuthMax: 28 * DEG,
    polar: Math.PI / 2 + 62 * DEG,
    azimuth: 0,
  },
  orbit: {
    rotate: true,
    polarMin: Math.PI / 2 + 18 * DEG,
    polarMax: Math.PI / 2 + 68 * DEG,
    azimuthMin: -Math.PI,
    azimuthMax: Math.PI,
    polar: Math.PI / 2 + 40 * DEG,
    azimuth: 0,
  },
};

/** Camera offset for a Z-up map. Radius is distance to the target. */
export function cameraOffset(polar: number, azimuth: number, radius: number): [number, number, number] {
  return [
    radius * Math.sin(polar) * Math.sin(azimuth),
    radius * Math.cos(polar),
    radius * Math.sin(polar) * Math.cos(azimuth),
  ];
}

export function tiltFromVerticalDeg(polar: number): number {
  return ((polar - Math.PI / 2) * 180) / Math.PI;
}

export function headingDeg(azimuth: number): number {
  let deg = (azimuth * 180) / Math.PI;
  if (deg > 180) deg -= 360;
  if (deg < -180) deg += 360;
  return deg;
}
