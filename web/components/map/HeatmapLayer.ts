import { AWAITING_CELL_RGB, INACTIVE_CELL_HEX, probabilityColor } from '@/lib/display/colors';
import { projectXY } from '@/lib/display/projection';
import type { GridPayload, ScenarioPayload } from '@/lib/payload/types';

export interface HeatmapLayerRefs {
  mesh: import('@/types/three-vendor').ThreeVendor;
  grey: import('@/types/three-vendor').ThreeVendor;
  transform: import('@/types/three-vendor').ThreeVendor;
  cellIndex: Map<number, number>;
}

export function createHeatmapLayer(
  THREE: typeof globalThis.THREE,
  scene: { add: (o: unknown) => void },
  grid: GridPayload,
  scenario: ScenarioPayload,
  options?: { terrainWash?: boolean },
): HeatmapLayerRefs {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const material = new THREE.MeshBasicMaterial({
    toneMapped: false,
    transparent: Boolean(options?.terrainWash),
    opacity: options?.terrainWash ? 0.62 : 1,
    depthWrite: !options?.terrainWash,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, scenario.cell_id.length);
  mesh.frustumCulled = false;

  const cellIndex = new Map(grid.cell_id.map((id, i) => [id, i]));
  const inactive = grid.cell_id
    .map((_, i) => i)
    .filter((i) => !grid.active[i]);

  const grey = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: INACTIVE_CELL_HEX }),
    inactive.length,
  );

  const transform = new THREE.Object3D();

  inactive.forEach((gridIdx, j) => {
    const v = projectXY(grid, grid.x_m[gridIdx], grid.y_m[gridIdx], -50);
    transform.position.set(v.x, v.y, v.z);
    transform.scale.set(
      grid.cell_size_m / 1000,
      grid.cell_size_m / 1000,
      0.08,
    );
    transform.updateMatrix();
    grey.setMatrixAt(j, transform.matrix);
  });

  scene.add(mesh);
  scene.add(grey);

  return { mesh, grey, transform, cellIndex };
}

export function setHeatmapTerrainWash(refs: HeatmapLayerRefs, enabled: boolean): void {
  const mat = refs.mesh.material as {
    transparent: boolean;
    opacity: number;
    depthWrite: boolean;
    needsUpdate?: boolean;
  };
  mat.transparent = enabled;
  mat.opacity = enabled ? 0.62 : 1;
  mat.depthWrite = !enabled;
  mat.needsUpdate = true;
}

export function updateHeatmapLayer(
  THREE: typeof globalThis.THREE,
  refs: HeatmapLayerRefs,
  grid: GridPayload,
  scenario: ScenarioPayload,
  damage: number[],
  time: number,
  options?: {
    highlightedCellIds?: Set<number>;
    dimUnhighlighted?: boolean;
  },
): void {
  const { mesh, transform, cellIndex } = refs;
  const awaiting = new THREE.Color(
    AWAITING_CELL_RGB.r,
    AWAITING_CELL_RGB.g,
    AWAITING_CELL_RGB.b,
  );

  damage.forEach((prob, i) => {
    const id = scenario.cell_id[i];
    const g = cellIndex.get(id);
    if (g === undefined) return;
    const v = projectXY(grid, grid.x_m[g], grid.y_m[g], 40);
    transform.position.set(v.x, v.y, v.z);
    transform.scale.set(grid.cell_size_m / 1000, grid.cell_size_m / 1000, 1);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);

    let color: import('@/types/three-vendor').ThreeVendor;
    if (time < scenario.onset_s[i]) {
      color = awaiting;
    } else {
      let rgb = probabilityColor(prob);
      const cellId = scenario.cell_id[i];
      if (
        options?.dimUnhighlighted &&
        options.highlightedCellIds &&
        !options.highlightedCellIds.has(cellId)
      ) {
        const f = 0.25;
        rgb = {
          r: rgb.r * f + (1 - f) * 0.85,
          g: rgb.g * f + (1 - f) * 0.86,
          b: rgb.b * f + (1 - f) * 0.88,
        };
      }
      color = new THREE.Color(rgb.r, rgb.g, rgb.b);
    }
    mesh.setColorAt(i, color);
  });

  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
}