import { describe, expect, it } from 'vitest';
import { utm51nForward, utm51nInverse } from './utm51n';

const vectors = [
  [123.0, 0.0, 500000.0, 0.0],
  [121.07011, 14.58, 292088.421, 1612754.668],
  [121.04696, 14.4, 289423.626, 1592857.845],
  [121.0, 14.6, 284552.125, 1615033.119],
  [121.1, 14.4, 295144.264, 1592809.991],
] as const;

describe('utm51n', () => {
  it('matches the Snyder forward vectors within 0.05 m', () => {
    for (const [lon, lat, east, north] of vectors) {
      const [x, y] = utm51nForward(lon, lat);
      expect(Math.abs(x - east)).toBeLessThanOrEqual(0.05);
      expect(Math.abs(y - north)).toBeLessThanOrEqual(0.05);
    }
  });

  it('inverts those eastings and northings', () => {
    for (const [lon, lat, east, north] of vectors) {
      const [olon, olat] = utm51nInverse(east, north);
      const [x, y] = utm51nForward(olon, olat);
      expect(Math.abs(olon - lon)).toBeLessThan(1e-6);
      expect(Math.abs(olat - lat)).toBeLessThan(1e-6);
      expect(Math.hypot(x - east, y - north)).toBeLessThanOrEqual(0.05);
    }
  });
});