import { describe, expect, it } from 'vitest';

import { CAMERA_LIMITS, cameraOffset } from './cameraLimits';

describe('cameraOffset', () => {
  it('places bird’s-eye on +Z with north as +Y', () => {
    const [x, y, z] = cameraOffset(CAMERA_LIMITS.bird.polar, CAMERA_LIMITS.bird.azimuth, 80);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(80, 6);
  });

  it('keeps oblique and low cameras above the map and south of the target', () => {
    for (const mode of ['oblique', 'low'] as const) {
      const limit = CAMERA_LIMITS[mode];
      const [x, y, z] = cameraOffset(limit.polar, limit.azimuth, 40);
      expect(z).toBeGreaterThan(5);
      expect(y).toBeLessThan(0);
      expect(Math.abs(x)).toBeLessThan(1e-6);
      expect(limit.polarMax).toBeLessThan(Math.PI - 0.2);
    }
  });
});