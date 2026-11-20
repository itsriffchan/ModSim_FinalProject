import { projectXY } from '@/lib/display/projection';
import type { GridPayload, OverlaysPayload } from '@/lib/payload/types';

export interface PlaceLabelSpec {
  name: string;
  x_m: number;
  y_m: number;
}

function shortName(name: string): string {
  return name.replace(/^City of /i, '');
}

function centroid(xy: OverlaysPayload['lgu'][number]['xy_m']): [number, number] | null {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const pair of xy) {
    if (!pair || pair[0] == null || pair[1] == null) continue;
    sx += pair[0];
    sy += pair[1];
    n += 1;
  }
  if (n === 0) return null;
  return [sx / n, sy / n];
}

/** LGU names from saved outlines, plus bay labels outside the grid. */
export function placeLabelSpecs(grid: GridPayload, overlays: OverlaysPayload): PlaceLabelSpec[] {
  const labels: PlaceLabelSpec[] = [];
  for (const lgu of overlays.lgu) {
    const c = centroid(lgu.xy_m);
    if (!c) continue;
    labels.push({ name: shortName(lgu.name), x_m: c[0], y_m: c[1] });
  }

  const minX = Math.min(...grid.x_m);
  const maxX = Math.max(...grid.x_m);
  const minY = Math.min(...grid.y_m);
  const maxY = Math.max(...grid.y_m);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  labels.push(
    { name: 'Manila Bay', x_m: minX - spanX * 0.16, y_m: (minY + maxY) / 2 },
    { name: 'Laguna de Bay', x_m: maxX + spanX * 0.1, y_m: minY + spanY * 0.28 },
  );
  return labels;
}

export function addPlaceLabelAnchors(
  THREE: typeof globalThis.THREE,
  scene: { add: (o: unknown) => void },
  grid: GridPayload,
  overlays: OverlaysPayload,
): import('@/types/three-vendor').ThreeVendor[] {
  const anchors: import('@/types/three-vendor').ThreeVendor[] = [];
  for (const spec of placeLabelSpecs(grid, overlays)) {
    const v = projectXY(grid, spec.x_m, spec.y_m, 200);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 6),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    dot.position.set(v.x, v.y, v.z);
    dot.userData.label = spec.name;
    scene.add(dot);
    anchors.push(dot);
  }
  return anchors;
}
