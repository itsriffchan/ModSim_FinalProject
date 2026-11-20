'use client';

import { projectXY } from '@/lib/display/projection';
import type { GridPayload } from '@/lib/payload/types';

export function addIllustrativeScenery(
  THREE: typeof globalThis.THREE,
  scene: { add: (o: unknown) => void },
  grid: GridPayload,
): { group: import('@/types/three-vendor').ThreeVendor; buildings: import('@/types/three-vendor').ThreeVendor } {
  const group = new THREE.Group();
  group.name = 'illustrative-scenery';

  const minX = Math.min(...grid.x_m);
  const maxX = Math.max(...grid.x_m);
  const minY = Math.min(...grid.y_m);
  const maxY = Math.max(...grid.y_m);
  const spanX = (maxX - minX) / 1000;
  const spanY = (maxY - minY) / 1000;
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.max(spanX, spanY) * 4, Math.max(spanX, spanY) * 4),
    new THREE.MeshBasicMaterial({ color: 0xc5d8e6, depthWrite: false }),
  );
  water.position.z = -0.2;
  water.renderOrder = -2;
  group.add(water);

  const buildings = new THREE.Group();
  buildings.name = 'illustrative-buildings';
  const rng = (seed: number) => {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 36; i++) {
    const gx = minX + rng(i + 1) * (maxX - minX);
    const gy = minY + rng(i + 2) * (maxY - minY);
    const h = 0.06 + rng(i + 3) * 0.22;
    const w = 0.07 + rng(i + 4) * 0.1;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, w, h),
      new THREE.MeshBasicMaterial({
        color: 0xb7c6d0,
        transparent: true,
        opacity: 0.7,
      }),
    );
    const p = projectXY(grid, gx, gy, 0);
    box.position.set(p.x, p.y, h / 2);
    buildings.add(box);
  }
  buildings.visible = false;
  group.add(buildings);
  scene.add(group);
  return { group, buildings };
}

export function IllustrativeSceneryBadge() {
  return (
    <div className="explorer-map-badge" role="note">
      Illustrative water and buildings — not a measured inventory. Bay names are geographic context.
    </div>
  );
}
