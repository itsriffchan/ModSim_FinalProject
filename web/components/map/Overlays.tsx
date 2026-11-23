import { ARRIVAL_EDGE_HEX } from '@/lib/display/colors';
import { buildArrivalEdges, arrivalBoundarySegmentIndices } from '@/lib/display/arrivalEdges';
import { projectXY } from '@/lib/display/projection';
import { ncrOuterRingsM } from '@/lib/map/ncrBoundary';
import { NCR_BORDER_HEX, NCR_BORDER_WIDTH_M } from '@/lib/map/ncrCamera';
import { addBrokenPolyline } from '@/lib/map/polyline';
import type {
  GridPayload,
  OverlaysPayload,
  PresentationPayload,
  ScenarioPayload,
} from '@/lib/payload/types';

export interface OverlayRefs {
  boundary: import('@/types/three-vendor').ThreeVendor;
  edges: ReturnType<typeof buildArrivalEdges>;
}

export function addMapOverlays(
  THREE: typeof globalThis.THREE,
  scene: { add: (o: unknown) => void },
  payload: PresentationPayload,
  scenario: ScenarioPayload,
): OverlayRefs {
  const { grid, overlays } = payload;

  for (const lgu of overlays.lgu) {
    addBrokenPolyline(scene, THREE, grid, lgu.xy_m, 0x354d60);
  }
  addNcrBorderRibbon(scene, THREE, grid, overlays);
  addBrokenPolyline(scene, THREE, grid, overlays.fault_xy_m, 0xa92349);

  const [ex, ey] = scenario.epicenter_xy_m;
  for (const [inner, outer, hex] of [
    [0.52, 0.72, 0xffffff],
    [0.72, 0.8, 0x101b27],
  ] as const) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 32),
      new THREE.MeshBasicMaterial({
        color: hex,
        depthTest: false,
        transparent: true,
      }),
    );
    const pos = projectXY(grid, ex, ey, 150);
    ring.position.set(pos.x, pos.y, pos.z);
    ring.renderOrder = 6;
    scene.add(ring);
  }

  addBrokenPolyline(
    scene,
    THREE,
    grid,
    [
      [ex - 650, ey],
      [ex + 650, ey],
    ],
    0x101b27,
  );
  addBrokenPolyline(
    scene,
    THREE,
    grid,
    [
      [ex, ey - 650],
      [ex, ey + 650],
    ],
    0x101b27,
  );

  const edges = buildArrivalEdges(grid, scenario);
  const boundary = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: ARRIVAL_EDGE_HEX, depthTest: false }),
  );
  boundary.renderOrder = 4;
  scene.add(boundary);

  return { boundary, edges };
}

export function updateArrivalBoundary(
  THREE: typeof globalThis.THREE,
  grid: GridPayload,
  refs: OverlayRefs,
  scenario: ScenarioPayload,
  time: number,
): void {
  const active = arrivalBoundarySegmentIndices(refs.edges, scenario.onset_s, time);
  const vertices: number[] = [];

  for (const edgeIdx of active) {
    const edge = refs.edges[edgeIdx];
    for (const point of edge.points) {
      const v = projectXY(grid, point[0], point[1], 100);
      vertices.push(v.x, v.y, v.z);
    }
  }

  refs.boundary.geometry.dispose();
  refs.boundary.geometry = new THREE.BufferGeometry();
  refs.boundary.geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
}

export function overlayLegendItems(overlays: OverlaysPayload) {
  return {
    lguCount: overlays.lgu.length,
    faultSegments: overlays.fault_xy_m.length,
  };
}

type Pt = [number, number];

function segmentNormal(x0: number, y0: number, x1: number, y1: number): { x: number; y: number } {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

function miterOffset(pts: Pt[], index: number, closed: boolean, half: number) {
  const count = pts.length;
  const curr = pts[index];
  const hasPrev = closed || index > 0;
  const hasNext = closed || index < count - 1;
  const prev = pts[(index - 1 + count) % count];
  const next = pts[(index + 1) % count];
  const single = !hasPrev
    ? segmentNormal(curr[0], curr[1], next[0], next[1])
    : !hasNext
      ? segmentNormal(prev[0], prev[1], curr[0], curr[1])
      : null;
  if (single) {
    return {
      lx: curr[0] + single.x * half,
      ly: curr[1] + single.y * half,
      rx: curr[0] - single.x * half,
      ry: curr[1] - single.y * half,
    };
  }

  const n0 = segmentNormal(prev[0], prev[1], curr[0], curr[1]);
  const n1 = segmentNormal(curr[0], curr[1], next[0], next[1]);
  let mx = n0.x + n1.x;
  let my = n0.y + n1.y;
  const ml = Math.hypot(mx, my);
  if (ml < 1e-6) {
    mx = n0.x;
    my = n0.y;
  } else {
    mx /= ml;
    my /= ml;
  }
  const denom = mx * n0.x + my * n0.y;
  const signed = Math.abs(denom) < 0.25 ? Math.sign(denom || 1) * 0.25 : denom;
  let scale = half / signed;
  const cap = half * 3;
  if (scale > cap) scale = cap;
  if (scale < -cap) scale = -cap;
  return {
    lx: curr[0] + mx * scale,
    ly: curr[1] + my * scale,
    rx: curr[0] - mx * scale,
    ry: curr[1] - my * scale,
  };
}

function addNcrBorderRibbon(
  scene: { add: (object: unknown) => void },
  THREE: typeof globalThis.THREE,
  grid: GridPayload,
  overlays: OverlaysPayload,
): void {
  const half = NCR_BORDER_WIDTH_M / 2;
  const positions: number[] = [];

  const pushCorner = (x: number, y: number) => {
    const projected = projectXY(grid, x, y, 200);
    positions.push(projected.x, projected.y, projected.z);
  };

  for (const ring of ncrOuterRingsM(overlays)) {
    if (ring.length < 2) continue;
    const first = ring[0];
    const last = ring[ring.length - 1];
    const closed = Math.hypot(first[0] - last[0], first[1] - last[1]) <= 0.05;
    const pts = closed ? ring.slice(0, -1) : ring;
    if (pts.length < 2) continue;
    const offsets = pts.map((_, index) => miterOffset(pts, index, closed, half));
    const segments = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < segments; i++) {
      const j = (i + 1) % pts.length;
      const a = offsets[i];
      const b = offsets[j];
      pushCorner(a.lx, a.ly);
      pushCorner(b.lx, b.ly);
      pushCorner(a.rx, a.ry);
      pushCorner(a.rx, a.ry);
      pushCorner(b.lx, b.ly);
      pushCorner(b.rx, b.ry);
    }
  }

  if (positions.length < 9) return;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: NCR_BORDER_HEX,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  mesh.renderOrder = 8;
  scene.add(mesh);
}