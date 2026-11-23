'use client';

import { useCallback, useState } from 'react';

export interface MapViewport {
  panX: number;
  panY: number;
  zoom: number;
}

const DEFAULT: MapViewport = { panX: 0, panY: 0, zoom: 1 };

export function useMapViewport(initial?: Partial<MapViewport>) {
  const [viewport, setViewport] = useState<MapViewport>({ ...DEFAULT, ...initial });

  const setFrom = useCallback((next: MapViewport) => {
    setViewport(next);
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setViewport((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
  }, []);

  const zoomBy = useCallback((factor: number) => {
    setViewport((v) => ({
      ...v,
      zoom: Math.min(8, Math.max(0.45, v.zoom * factor)),
    }));
  }, []);

  const reset = useCallback(() => setViewport(DEFAULT), []);

  return { viewport, setFrom, panBy, zoomBy, reset };
}

export type MapViewportController = ReturnType<typeof useMapViewport>;