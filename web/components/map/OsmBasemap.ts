'use client';

import type { BasemapLayer } from '@/lib/basemap/osmTiles';
import { allTileKeys, tileCacheKey, tileGeometry } from '@/lib/basemap/osmTiles';
import {
  basemapStatus,
  getBrowserTileCache,
  loadOsmTile,
  type BasemapLoadStatus,
} from '@/lib/basemap/tileCache';
import type { GridPayload } from '@/lib/payload/types';

export interface OsmBasemapHandle {
  dispose: () => void;
}

type TileMesh = {
  z: number;
  x: number;
  y: number;
  mesh: import('@/types/three-vendor').ThreeVendor;
  material: import('@/types/three-vendor').ThreeVendor;
  geometry: import('@/types/three-vendor').ThreeVendor;
};

export function addOsmBasemap(
  THREE: typeof globalThis.THREE,
  scene: { add: (o: unknown) => void },
  grid: GridPayload,
  layers: BasemapLayer[],
  onStatus: (status: BasemapLoadStatus) => void,
): OsmBasemapHandle {
  const group = new THREE.Group();
  group.name = 'osm-basemap';
  scene.add(group);

  const cache = getBrowserTileCache();
  const tileMeshes: TileMesh[] = [];
  const textures: import('@/types/three-vendor').ThreeVendor[] = [];
  let disposed = false;

  const uniqueKeys = allTileKeys(layers);

  for (const layer of layers) {
    for (const t of layer.tiles) {
      const { positions, uvs, indices } = tileGeometry(grid, layer.z, t.x, t.y);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));

      const material = new THREE.MeshBasicMaterial({
        color: 0xdfe7ee,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = layer.zKm;
      mesh.renderOrder = Math.round(-15 + layer.zKm * 100);
      group.add(mesh);
      tileMeshes.push({ z: layer.z, x: t.x, y: t.y, mesh, material, geometry });
    }
  }

  if (uniqueKeys.length === 0) {
    onStatus('failed');
    return {
      dispose() {
        disposed = true;
        scene.remove(group);
      },
    };
  }

  let settled = 0;
  let fulfilled = 0;
  let rejected = 0;

  const report = () => {
    if (disposed) return;
    if (settled < uniqueKeys.length) {
      if (fulfilled > 0) onStatus('partial');
      return;
    }
    onStatus(basemapStatus(uniqueKeys.length, fulfilled, rejected));
  };

  const applyTexture = (z: number, x: number, y: number, img: HTMLImageElement) => {
    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    textures.push(texture);
    for (const entry of tileMeshes) {
      if (entry.z === z && entry.x === x && entry.y === y) {
        entry.material.map = texture;
        entry.material.opacity = 1;
        entry.material.needsUpdate = true;
      }
    }
  };

  const removeMeshesForKey = (z: number, x: number, y: number) => {
    for (let i = tileMeshes.length - 1; i >= 0; i--) {
      const entry = tileMeshes[i]!;
      if (entry.z === z && entry.x === x && entry.y === y) {
        group.remove(entry.mesh);
        entry.geometry.dispose?.();
        entry.material.dispose?.();
        tileMeshes.splice(i, 1);
      }
    }
  };

  for (const key of uniqueKeys) {
    const { z, x, y } = {
      z: Number(key.split('/')[0]),
      x: Number(key.split('/')[1]),
      y: Number(key.split('/')[2]),
    };
    void loadOsmTile(cache, z, x, y)
      .then((img) => {
        if (disposed) return;
        applyTexture(z, x, y, img);
        fulfilled += 1;
        settled += 1;
        report();
      })
      .catch(() => {
        if (disposed) return;
        removeMeshesForKey(z, x, y);
        rejected += 1;
        settled += 1;
        report();
      });
  }

  return {
    dispose() {
      disposed = true;
      scene.remove(group);
      for (const entry of tileMeshes) {
        entry.geometry?.dispose?.();
        if (entry.material?.map) {
          entry.material.map.dispose?.();
        }
        entry.material?.dispose?.();
      }
      for (const tex of textures) {
        tex.dispose?.();
      }
    },
  };
}