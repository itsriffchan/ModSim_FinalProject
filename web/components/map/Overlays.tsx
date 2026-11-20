import { ARRIVAL_EDGE_HEX } from '@/lib/display/colors';
import { buildArrivalEdges, arrivalBoundarySegmentIndices } from '@/lib/display/arrivalEdges';
import { projectXY } from '@/lib/display/projection';
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