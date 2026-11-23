import { ncrOuterRingsM } from '@/lib/map/ncrBoundary';
import type { OverlaysPayload } from '@/lib/payload/types';

export type Pt = [number, number];

export interface RectM {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const SNAP = 100;

function snap(p: Pt): Pt {
  return [Math.round(p[0] * SNAP) / SNAP, Math.round(p[1] * SNAP) / SNAP];
}

function keyOf(p: Pt): string {
  const s = snap(p);
  return `${s[0]}:${s[1]}`;
}

function pointInRing(x: number, y: number, ring: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const crosses = yi > y !== yj > y;
    if (!crosses) continue;
    const xHit = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (x < xHit) inside = !inside;
  }
  return inside;
}

function pointInRings(x: number, y: number, rings: Pt[][]): boolean {
  let inside = false;
  for (const ring of rings) {
    if (pointInRing(x, y, ring)) inside = !inside;
  }
  return inside;
}

function signedArea(ring: Pt[]): number {
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

/** Portion of a segment inside an axis-aligned rectangle, or null. */
function clipSegmentToRect(a: Pt, b: Pt, rect: RectM): [Pt, Pt] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - rect.minX, rect.maxX - a[0], a[1] - rect.minY, rect.maxY - a[1]];
  for (let i = 0; i < 4; i++) {
    const pi = p[i];
    const qi = q[i];
    if (Math.abs(pi) < 1e-12) {
      if (qi < 0) return null;
      continue;
    }
    const t = qi / pi;
    if (pi < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  if (t1 - t0 < 1e-9) return null;
  return [
    snap([a[0] + t0 * dx, a[1] + t0 * dy]),
    snap([a[0] + t1 * dx, a[1] + t1 * dy]),
  ];
}

function rectCorners(rect: RectM): Pt[] {
  return [
    [rect.minX, rect.minY],
    [rect.maxX, rect.minY],
    [rect.maxX, rect.maxY],
    [rect.minX, rect.maxY],
  ];
}

interface IndexedEdge {
  a: Pt;
  b: Pt;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function ringEdges(ring: Pt[]): [Pt, Pt][] {
  const edges: [Pt, Pt][] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (a[0] === b[0] && a[1] === b[1]) continue;
    edges.push([a, b]);
  }
  return edges;
}

function indexEdges(rings: Pt[][]): { edges: IndexedEdge[]; buckets: Map<string, number[]> } {
  const edges: IndexedEdge[] = [];
  const buckets = new Map<string, number[]>();
  const add = (index: number, x: number, y: number) => {
    const key = `${Math.floor(x / 500)}:${Math.floor(y / 500)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      if (bucket[bucket.length - 1] !== index) bucket.push(index);
    } else buckets.set(key, [index]);
  };
  for (const ring of rings) {
    for (const [a, b] of ringEdges(ring)) {
      const index = edges.length;
      const minX = Math.min(a[0], b[0]);
      const maxX = Math.max(a[0], b[0]);
      const minY = Math.min(a[1], b[1]);
      const maxY = Math.max(a[1], b[1]);
      edges.push({ a, b, minX, minY, maxX, maxY });
      const ix0 = Math.floor(minX / 500);
      const ix1 = Math.floor(maxX / 500);
      const iy0 = Math.floor(minY / 500);
      const iy1 = Math.floor(maxY / 500);
      for (let ix = ix0; ix <= ix1; ix++) {
        for (let iy = iy0; iy <= iy1; iy++) add(index, ix * 500, iy * 500);
      }
    }
  }
  return { edges, buckets };
}

function edgesTouching(rect: RectM, edges: IndexedEdge[], buckets: Map<string, number[]>): IndexedEdge[] {
  const found = new Set<number>();
  const out: IndexedEdge[] = [];
  const ix0 = Math.floor(rect.minX / 500);
  const ix1 = Math.floor((rect.maxX - 1e-6) / 500);
  const iy0 = Math.floor(rect.minY / 500);
  const iy1 = Math.floor((rect.maxY - 1e-6) / 500);
  for (let ix = ix0; ix <= ix1; ix++) {
    for (let iy = iy0; iy <= iy1; iy++) {
      const bucket = buckets.get(`${ix}:${iy}`);
      if (!bucket) continue;
      for (const index of bucket) {
        if (found.has(index)) continue;
        const edge = edges[index];
        if (edge.maxX < rect.minX || edge.minX > rect.maxX || edge.maxY < rect.minY || edge.minY > rect.maxY) {
          continue;
        }
        found.add(index);
        out.push(edge);
      }
    }
  }
  return out;
}

function inward(mid: Pt, rect: RectM): Pt {
  const cx = (rect.minX + rect.maxX) / 2;
  const cy = (rect.minY + rect.maxY) / 2;
  const dx = cx - mid[0];
  const dy = cy - mid[1];
  const len = Math.hypot(dx, dy) || 1;
  return [mid[0] + (dx / len) * 0.4, mid[1] + (dy / len) * 0.4];
}

function boundarySpans(rect: RectM, touching: IndexedEdge[], rings: Pt[][]): [Pt, Pt][] {
  const corners = rectCorners(rect);
  const segments: [Pt, Pt][] = [];
  for (let e = 0; e < 4; e++) {
    const a = corners[e];
    const b = corners[(e + 1) % 4];
    const ts = [0, 1];
    for (const edge of touching) {
      const hit = clipSegmentToRect(edge.a, edge.b, rect);
      if (!hit) continue;
      for (const p of hit) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len2 = dx * dx + dy * dy;
        if (len2 < 1e-9) continue;
        const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
        const px = a[0] + t * dx;
        const py = a[1] + t * dy;
        if (t > 0.0001 && t < 0.9999 && Math.hypot(px - p[0], py - p[1]) < 0.2) ts.push(t);
      }
    }
    ts.sort((u, v) => u - v);
    const unique: number[] = [];
    for (const t of ts) {
      if (unique.length === 0 || t - unique[unique.length - 1] > 0.0001) unique.push(t);
    }
    for (let i = 0; i < unique.length - 1; i++) {
      const t0 = unique[i];
      const t1 = unique[i + 1];
      if (t1 - t0 < 0.0001) continue;
      const midT = (t0 + t1) / 2;
      const mid: Pt = [a[0] + (b[0] - a[0]) * midT, a[1] + (b[1] - a[1]) * midT];
      const probe = inward(mid, rect);
      if (!pointInRings(probe[0], probe[1], rings)) continue;
      segments.push([
        snap([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0]),
        snap([a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1]),
      ]);
    }
  }
  return segments;
}

function dedupe(segments: [Pt, Pt][]): [Pt, Pt][] {
  const seen = new Set<string>();
  const out: [Pt, Pt][] = [];
  for (const [a, b] of segments) {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === kb) continue;
    const id = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push([snap(a), snap(b)]);
  }
  return out;
}

function walkRings(segments: [Pt, Pt][]): Pt[][] {
  const point = new Map<string, Pt>();
  const outgoing = new Map<string, { to: string; ang: number }[]>();
  const link = (a: Pt, b: Pt) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    point.set(ka, snap(a));
    point.set(kb, snap(b));
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const list = outgoing.get(ka);
    if (list) list.push({ to: kb, ang });
    else outgoing.set(ka, [{ to: kb, ang }]);
  };
  for (const [a, b] of segments) {
    link(a, b);
    link(b, a);
  }
  for (const list of outgoing.values()) list.sort((u, v) => u.ang - v.ang);

  const used = new Set<string>();
  const edgeId = (from: string, to: string) => `${from}>${to}`;
  const rings: Pt[][] = [];

  for (const [from, list] of outgoing) {
    for (const edge of list) {
      if (used.has(edgeId(from, edge.to))) continue;
      const ring: Pt[] = [];
      let cur = from;
      let next = edge.to;
      let closed = false;
      for (let guard = 0; guard < segments.length * 4 + 4; guard++) {
        const id = edgeId(cur, next);
        if (used.has(id)) break;
        used.add(id);
        const here = point.get(cur);
        if (!here) break;
        ring.push(here);
        if (next === from) {
          closed = true;
          break;
        }
        const arrived = Math.atan2(
          point.get(cur)![1] - point.get(next)![1],
          point.get(cur)![0] - point.get(next)![0],
        );
        const choices = outgoing.get(next) ?? [];
        let chosen = choices.find((choice) => choice.to !== cur) ?? choices[0];
        for (const choice of choices) {
          if (choice.to === cur) continue;
          if (choice.ang > arrived + 1e-9) {
            chosen = choice;
            break;
          }
        }
        cur = next;
        next = chosen.to;
      }
      if (!closed || ring.length < 3) continue;
      const area = signedArea(ring);
      if (Math.abs(area) < 1) continue;
      const normalized = area < 0 ? ring.slice().reverse() : ring;
      const id = normalized.map((point) => keyOf(point)).sort().join('|');
      if (rings.some((existing) => existing.map((point) => keyOf(point)).sort().join('|') === id)) {
        continue;
      }
      rings.push(normalized);
    }
  }
  return rings;
}

/**
 * Cell square cut by the NCR rings. A cell with no boundary crossing is kept
 * whole when its center is inside, and dropped when it is outside.
 */
export function clipRectToRings(rect: RectM, rings: Pt[][], index?: ReturnType<typeof indexEdges>): Pt[][] {
  if (rings.length === 0) return [rectCorners(rect)];
  const built = index ?? indexEdges(rings);
  const touching = edgesTouching(rect, built.edges, built.buckets);
  if (touching.length === 0) {
    const cx = (rect.minX + rect.maxX) / 2;
    const cy = (rect.minY + rect.maxY) / 2;
    return pointInRings(cx, cy, rings) ? [rectCorners(rect)] : [];
  }

  const segments: [Pt, Pt][] = [];
  for (const edge of touching) {
    const hit = clipSegmentToRect(edge.a, edge.b, rect);
    if (hit) segments.push(hit);
  }
  segments.push(...boundarySpans(rect, touching, rings));
  return walkRings(dedupe(segments));
}

export function ncrClipIndex(overlays: OverlaysPayload): {
  rings: Pt[][];
  index: ReturnType<typeof indexEdges>;
} | null {
  const rings = ncrOuterRingsM(overlays).filter((ring) => ring.length >= 3);
  if (rings.length === 0) return null;
  return { rings, index: indexEdges(rings) };
}
