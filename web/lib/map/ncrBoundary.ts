import type { LguOverlay, OverlaysPayload } from '@/lib/payload/types';

/**
 * Outer NCR perimeter from the saved LGU rings.
 * Neighboring cities share vertices but not the same segment breaks, so each
 * segment is split at vertices that lie on it. Edges used more than once are
 * internal city borders and are dropped.
 */

const ON_SEGMENT_M = 1;
const CELL_M = 64;

export interface ExtentM {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type Pt = [number, number];

export function vertexKey(x: number, y: number): string {
  return `${Math.round(x * 100)}:${Math.round(y * 100)}`;
}

/** Closed rings with the repeated closing vertex removed. */
export function lguRingsM(xy: LguOverlay['xy_m']): Pt[][] {
  const rings: Pt[][] = [];
  let current: Pt[] = [];

  const flush = () => {
    if (current.length >= 3) {
      const first = current[0];
      const last = current[current.length - 1];
      if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 0.05) {
        current = current.slice(0, -1);
      }
      if (current.length >= 3) rings.push(current);
    }
    current = [];
  };

  for (const pt of xy) {
    if (!Array.isArray(pt) || pt.length < 2) {
      flush();
      continue;
    }
    const x = pt[0];
    const y = pt[1];
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
      flush();
      continue;
    }
    const prev = current[current.length - 1];
    if (prev && prev[0] === x && prev[1] === y) continue;
    current.push([x, y]);
  }
  flush();
  return rings;
}

export function ncrExtentM(overlays: OverlaysPayload): ExtentM | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const lgu of overlays.lgu) {
    for (const ring of lguRingsM(lgu.xy_m)) {
      for (const [x, y] of ring) {
        any = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!any) return null;
  return { minX, minY, maxX, maxY };
}

export function padExtent(extent: ExtentM, padM: number): ExtentM {
  return {
    minX: extent.minX - padM,
    minY: extent.minY - padM,
    maxX: extent.maxX + padM,
    maxY: extent.maxY + padM,
  };
}

function cellKey(x: number, y: number): string {
  return `${Math.floor(x / CELL_M)},${Math.floor(y / CELL_M)}`;
}

function verticesOnSegment(a: Pt, b: Pt, vertices: Pt[], grid: Map<string, number[]>): Pt[] {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const len2 = abx * abx + aby * aby;
  const len = Math.sqrt(len2);
  if (len < 1e-6) return [];

  const tol = ON_SEGMENT_M;
  const minX = Math.min(a[0], b[0]) - tol;
  const maxX = Math.max(a[0], b[0]) + tol;
  const minY = Math.min(a[1], b[1]) - tol;
  const maxY = Math.max(a[1], b[1]) + tol;
  const eps = tol / len;
  const ka = vertexKey(a[0], a[1]);
  const kb = vertexKey(b[0], b[1]);
  const hits: { t: number; p: Pt }[] = [];
  const seen = new Set<string>();

  const i0 = Math.floor(minX / CELL_M);
  const i1 = Math.floor(maxX / CELL_M);
  const j0 = Math.floor(minY / CELL_M);
  const j1 = Math.floor(maxY / CELL_M);
  for (let ix = i0; ix <= i1; ix++) {
    for (let iy = j0; iy <= j1; iy++) {
      const bucket = grid.get(`${ix},${iy}`);
      if (!bucket) continue;
      for (const index of bucket) {
        const p = vertices[index];
        const key = vertexKey(p[0], p[1]);
        if (key === ka || key === kb || seen.has(key)) continue;
        const t = ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2;
        if (t <= eps || t >= 1 - eps) continue;
        const qx = a[0] + t * abx;
        const qy = a[1] + t * aby;
        const dx = p[0] - qx;
        const dy = p[1] - qy;
        if (dx * dx + dy * dy > tol * tol) continue;
        seen.add(key);
        hits.push({ t, p });
      }
    }
  }

  hits.sort((u, v) => u.t - v.t);
  return hits.map((hit) => hit.p);
}

function chainOuter(edges: Array<[Pt, Pt]>): Pt[][] {
  const adj = new Map<string, string[]>();
  const pointOf = new Map<string, Pt>();

  const link = (a: Pt, b: Pt) => {
    const ka = vertexKey(a[0], a[1]);
    const kb = vertexKey(b[0], b[1]);
    if (ka === kb) return;
    pointOf.set(ka, a);
    pointOf.set(kb, b);
    const fromA = adj.get(ka);
    if (fromA) fromA.push(kb);
    else adj.set(ka, [kb]);
    const fromB = adj.get(kb);
    if (fromB) fromB.push(ka);
    else adj.set(kb, [ka]);
  };
  for (const [a, b] of edges) link(a, b);

  const used = new Set<string>();
  const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const rings: Pt[][] = [];

  for (const start of adj.keys()) {
    for (const next0 of adj.get(start) ?? []) {
      const firstEdge = edgeKey(start, next0);
      if (used.has(firstEdge)) continue;
      const ringKeys = [start];
      used.add(firstEdge);
      let prev = start;
      let cur = next0;
      for (let guard = 0; guard < edges.length + 2; guard++) {
        ringKeys.push(cur);
        if (cur === start) break;
        const prevPt = pointOf.get(prev);
        const curPt = pointOf.get(cur);
        if (!prevPt || !curPt) break;
        const incomingX = curPt[0] - prevPt[0];
        const incomingY = curPt[1] - prevPt[1];
        const incomingLen = Math.hypot(incomingX, incomingY) || 1;
        let best: string | null = null;
        let bestDot = -Infinity;
        for (const cand of adj.get(cur) ?? []) {
          if (cand === prev) continue;
          const candEdge = edgeKey(cur, cand);
          if (used.has(candEdge)) continue;
          const candPt = pointOf.get(cand);
          if (!candPt) continue;
          const dx = candPt[0] - curPt[0];
          const dy = candPt[1] - curPt[1];
          const len = Math.hypot(dx, dy) || 1;
          const dot = (incomingX * dx + incomingY * dy) / (incomingLen * len);
          if (dot > bestDot) {
            bestDot = dot;
            best = cand;
          }
        }
        if (!best) break;
        used.add(edgeKey(cur, best));
        prev = cur;
        cur = best;
      }
      if (ringKeys.length < 2) continue;
      const ring = ringKeys.map((key) => pointOf.get(key)!);
      rings.push(ring);
    }
  }
  return rings;
}

const outerRingCache = new WeakMap<OverlaysPayload, Pt[][]>();

export function ncrOuterRingsM(overlays: OverlaysPayload): Pt[][] {
  const cached = outerRingCache.get(overlays);
  if (cached) return cached;
  const rings = buildOuterRings(overlays);
  outerRingCache.set(overlays, rings);
  return rings;
}

function buildOuterRings(overlays: OverlaysPayload): Pt[][] {
  const rings = overlays.lgu.flatMap((lgu) => lguRingsM(lgu.xy_m));
  const vertices: Pt[] = [];
  const seen = new Set<string>();
  for (const ring of rings) {
    for (const point of ring) {
      const key = vertexKey(point[0], point[1]);
      if (seen.has(key)) continue;
      seen.add(key);
      vertices.push(point);
    }
  }

  const grid = new Map<string, number[]>();
  vertices.forEach((point, index) => {
    const key = cellKey(point[0], point[1]);
    const bucket = grid.get(key);
    if (bucket) bucket.push(index);
    else grid.set(key, [index]);
  });

  const edgeCount = new Map<string, { a: Pt; b: Pt; n: number }>();
  const addEdge = (a: Pt, b: Pt) => {
    const ka = vertexKey(a[0], a[1]);
    const kb = vertexKey(b[0], b[1]);
    if (ka === kb) return;
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    const existing = edgeCount.get(key);
    if (existing) existing.n += 1;
    else edgeCount.set(key, { a, b, n: 1 });
  };

  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const splits = verticesOnSegment(a, b, vertices, grid);
      let prev = a;
      for (const point of splits) {
        addEdge(prev, point);
        prev = point;
      }
      addEdge(prev, b);
    }
  }

  const outer: Array<[Pt, Pt]> = [];
  for (const edge of edgeCount.values()) {
    if (edge.n === 1) outer.push([edge.a, edge.b]);
  }
  return chainOuter(outer);
}
