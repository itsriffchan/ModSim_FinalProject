import { describe, expect, it } from 'vitest';

import { basemapStatus, createTileCache } from './tileCache';

function mockImage(): HTMLImageElement {
  return { width: 256, height: 256 } as HTMLImageElement;
}

describe('tileCache', () => {
  it('returns the same promise and calls loader once per key', async () => {
    const calls: string[] = [];
    const cache = createTileCache(async (_url, key) => {
      calls.push(key);
      return mockImage();
    });
    const k = '12/3473/1894';
    const a = cache.get(k);
    const b = cache.get(k);
    expect(a).toBe(b);
    await a;
    expect(calls).toEqual([k]);
  });

  it('evicts failed entries so retry invokes loader again', async () => {
    let attempts = 0;
    const cache = createTileCache(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('fail');
      return mockImage();
    });
    const k = '11/1736/947';
    await expect(cache.get(k)).rejects.toThrow('fail');
    await expect(cache.get(k)).resolves.toBeDefined();
    expect(attempts).toBe(2);
  });
});

describe('basemapStatus', () => {
  it('classifies ready, partial, and failed', () => {
    expect(basemapStatus(10, 10, 0)).toBe('ready');
    expect(basemapStatus(10, 6, 4)).toBe('partial');
    expect(basemapStatus(10, 0, 10)).toBe('failed');
    expect(basemapStatus(0, 0, 0)).toBe('failed');
    expect(basemapStatus(5, 2, 3)).toBe('partial');
  });
});