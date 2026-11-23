import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { OverlaysPayload } from '@/lib/payload/types';

import { lguRingsM, ncrExtentM, ncrOuterRingsM, vertexKey } from './ncrBoundary';
import { clampTarget, ncrTargetBoxKm, paddedNcrExtent } from './ncrCamera';

function square(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  extra: [number, number][] = [],
): [number, number][] {
  const ring: [number, number][] = [
    [x0, y0],
    [x1, y0],
    ...extra,
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ];
  return ring;
}

function hasPoint(rings: [number, number][][], x: number, y: number): boolean {
  return rings.some((ring) => ring.some((point) => Math.hypot(point[0] - x, point[1] - y) <= 0.05));
}

function pointSegmentDistance(
  point: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const len2 = abx * abx + aby * aby;
  if (len2 < 1e-12) return Math.hypot(point[0] - a[0], point[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * abx + (point[1] - a[1]) * aby) / len2));
  return Math.hypot(point[0] - (a[0] + t * abx), point[1] - (a[1] + t * aby));
}

function distanceToRings(point: [number, number], rings: [number, number][][]): number {
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      best = Math.min(best, pointSegmentDistance(point, ring[i], ring[i + 1]));
    }
    if (ring.length > 2) {
      const last = ring[ring.length - 1];
      const first = ring[0];
      if (last[0] !== first[0] || last[1] !== first[1]) {
        best = Math.min(best, pointSegmentDistance(point, last, first));
      }
    }
  }
  return best;
}

describe('ncrOuterRingsM', () => {
  it('drops the shared edge of two abutting squares, including an intermediate vertex', () => {
    const overlays: OverlaysPayload = {
      fault_xy_m: [],
      lgu: [
        {
          pcode: 'A',
          name: 'West',
          xy_m: square(0, 0, 10, 10, [[10, 5]]),
        },
        {
          pcode: 'B',
          name: 'East',
          xy_m: square(10, 0, 20, 10),
        },
      ],
    };
    const rings = ncrOuterRingsM(overlays);
    const closed = rings.filter(
      (ring) => ring.length >= 4 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1],
    );
    expect(closed).toHaveLength(1);
    expect(hasPoint(closed, 0, 0)).toBe(true);
    expect(hasPoint(closed, 20, 0)).toBe(true);
    expect(hasPoint(closed, 20, 10)).toBe(true);
    expect(hasPoint(closed, 0, 10)).toBe(true);
    expect(hasPoint(closed, 10, 5)).toBe(false);
    expect(distanceToRings([10, 5], closed)).toBeGreaterThan(4);
  });

  it('keeps a saved Pateros–Taguig border off the outer edge and inside the LGU extent', () => {
    const payloadPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../public/data/A/presentation_payload.json',
    );
    const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as {
      overlays: OverlaysPayload;
    };
    const overlays = payload.overlays;
    const extent = ncrExtentM(overlays);
    expect(extent).not.toBeNull();
    if (!extent) return;
    expect((extent.maxX - extent.minX) / 1000).toBeGreaterThan(24);
    expect((extent.maxX - extent.minX) / 1000).toBeLessThan(26);
    expect((extent.maxY - extent.minY) / 1000).toBeGreaterThan(47);
    expect((extent.maxY - extent.minY) / 1000).toBeLessThan(49);

    const rings = ncrOuterRingsM(overlays);
    expect(rings.length).toBeGreaterThan(0);
    expect(rings.length).toBeLessThan(15);
    for (const ring of rings) {
      for (const [x, y] of ring) {
        expect(x).toBeGreaterThanOrEqual(extent.minX - 1);
        expect(x).toBeLessThanOrEqual(extent.maxX + 1);
        expect(y).toBeGreaterThanOrEqual(extent.minY - 1);
        expect(y).toBeLessThanOrEqual(extent.maxY + 1);
      }
    }

    const pateros = overlays.lgu.find((lgu) => lgu.name === 'Pateros');
    const taguig = overlays.lgu.find((lgu) => lgu.name === 'Taguig City');
    expect(pateros).toBeTruthy();
    expect(taguig).toBeTruthy();
    if (!pateros || !taguig) return;
    const taguigRings = lguRingsM(taguig.xy_m);
    const taguigKeys = new Set(taguigRings.flat().map((point) => vertexKey(point[0], point[1])));
    let shared: [number, number] | null = null;
    for (const ring of lguRingsM(pateros.xy_m)) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        if (!taguigKeys.has(vertexKey(a[0], a[1])) || !taguigKeys.has(vertexKey(b[0], b[1]))) continue;
        const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if (distanceToRings(mid, taguigRings) < 0.05) {
          shared = mid;
          break;
        }
      }
      if (shared) break;
    }
    expect(shared).not.toBeNull();
    if (!shared) return;
    expect(distanceToRings(shared, rings)).toBeGreaterThan(500);
  });
});

describe('ncr camera clamp', () => {
  it('pads the LGU extent by 2 km and clamps the orbit target to that box', () => {
    const overlays: OverlaysPayload = {
      fault_xy_m: [],
      lgu: [
        {
          pcode: 'A',
          name: 'Box',
          xy_m: [
            [0, 0],
            [1000, 0],
            [1000, 1000],
            [0, 1000],
            [0, 0],
          ],
        },
      ],
    };
    const padded = paddedNcrExtent(overlays);
    expect(padded).toEqual({ minX: -2000, minY: -2000, maxX: 3000, maxY: 3000 });
    const box = ncrTargetBoxKm({ x_m: [0, 10000], y_m: [0, 20000] }, overlays);
    expect(box).toEqual({ minX: -7, maxX: -2, minY: -12, maxY: -7 });
    expect(clampTarget(3, 0.5, { minX: -1, maxX: 1, minY: -2, maxY: 2 })).toEqual({
      x: 1,
      y: 0.5,
      dx: -2,
      dy: 0,
    });
  });
});
