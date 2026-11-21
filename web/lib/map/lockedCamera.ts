import { CAMERA_LIMITS } from '@/lib/map/cameraLimits';
import type { CameraMode } from '@/lib/store/explorer-store';

/** Shared presentation camera for Next.js Region, City, and Compare maps. */
export const LOCKED_CAMERA_MODE: CameraMode = 'low';

export const LOCKED_CAMERA = CAMERA_LIMITS[LOCKED_CAMERA_MODE];