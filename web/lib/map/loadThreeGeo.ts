'use client';

import { loadVendorThree } from '@/lib/map/loadVendorThree';

declare global {
  interface Window {
    ThreeGeo?: new (opts: { tokenMapbox: string }) => ThreeGeoInstance;
  }
}

export interface ThreeGeoInstance {
  getTerrainRgb(
    origin: [number, number],
    radiusKm: number,
    zoom: number,
  ): Promise<import('@/types/three-vendor').ThreeVendor>;
  getProjection(
    origin: [number, number],
    radiusKm: number,
    unitsSide?: number,
  ): {
    bbox: [number, number, number, number];
    unitsPerMeter: number;
  };
}

export function loadThreeGeo(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('ThreeGeo can only load in the browser'));
  }

  return loadVendorThree().then(() => {
    const THREE = window.THREE;
    if (!THREE.PlaneBufferGeometry && THREE.PlaneGeometry) {
      THREE.PlaneBufferGeometry = THREE.PlaneGeometry;
    }
    if (window.ThreeGeo) return;

    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-modsim-three-geo]',
      );
      if (existing && window.ThreeGeo) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = '/vendor/three-geo.min.js';
      script.async = true;
      script.dataset.modsimThreeGeo = '1';
      script.onload = () => {
        if (typeof window.ThreeGeo === 'function') resolve();
        else reject(new Error('ThreeGeo did not register on window'));
      };
      script.onerror = () => reject(new Error('Failed to load three-geo.min.js'));
      document.head.appendChild(script);
    });
  });
}