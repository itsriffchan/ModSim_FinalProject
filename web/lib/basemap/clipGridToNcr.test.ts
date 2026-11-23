import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { clipRectToRings, ncrClipIndex, type Pt } from '@/lib/basemap/clipGridToNcr';
import type { GridPayload, OverlaysPayload } from '@/lib/payload/types';

function area(rings: Pt[][]): number {
  let total = 0;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      total += x1 * y2 - x2 * y1;
    }
  }
  return Math.abs(total) / 2;
}

const square: Pt[] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

/** Rectangle with a bay cut out of the right side. */
const notched: Pt[] = [
  [0, 0],
  [10, 0],
  [10, 4],
  [6, 4],
  [6, 6],
  [10, 6],
  [10, 10],
  [0, 10],
];

describe('clipRectToRings', () => {
  it('keeps an interior cell and drops an exterior cell', () => {
    const inside = clipRectToRings({ minX: 2, minY: 2, maxX: 4, maxY: 4 }, [square]);
    const outside = clipRectToRings({ minX: 20, minY: 20, maxX: 22, maxY: 22 }, [square]);
    expect(area(inside)).toBeCloseTo(4);
    expect(outside).toEqual([]);
  });

  it('cuts a cell that crosses the boundary', () => {
    const clipped = clipRectToRings({ minX: 8, minY: 2, maxX: 12, maxY: 6 }, [square]);
    expect(area(clipped)).toBeCloseTo(8);
    for (const ring of clipped) {
      for (const [x] of ring) expect(x).toBeLessThanOrEqual(10.01);
    }
  });

  it('follows a concave notch instead of filling the bay', () => {
    const clipped = clipRectToRings({ minX: 5, minY: 3, maxX: 9, maxY: 7 }, [notched]);
    const bay = clipRectToRings({ minX: 7, minY: 4.2, maxX: 8, maxY: 5.8 }, [notched]);
    expect(area(clipped)).toBeCloseTo(10);
    expect(bay).toEqual([]);
  });

  it('cuts the saved rectangular grid to the NCR outline', () => {
    const payloadPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../public/data/comparison/presentation_payload.json',
    );
    const payload = JSON.parse(readFileSync(payloadPath, 'utf8')) as {
      grid: GridPayload;
      overlays: OverlaysPayload;
    };
    const clip = ncrClipIndex(payload.overlays);
    expect(clip).not.toBeNull();
    if (!clip) return;
    const half = payload.grid.cell_size_m / 2;
    let kept = 0;
    const started = Date.now();
    for (let i = 0; i < payload.grid.cell_id.length; i++) {
      const x = payload.grid.x_m[i];
      const y = payload.grid.y_m[i];
      if (typeof x !== 'number' || typeof y !== 'number') continue;
      const pieces = clipRectToRings(
        { minX: x - half, minY: y - half, maxX: x + half, maxY: y + half },
        clip.rings,
        clip.index,
      );
      if (pieces.length > 0) kept += 1;
    }
    expect(Date.now() - started).toBeLessThan(8_000);
    expect(kept).toBeGreaterThan(500);
    expect(kept).toBeLessThan(payload.grid.cell_id.length);
  });
});
