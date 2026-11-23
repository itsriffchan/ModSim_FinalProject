'use client';

import type { CameraMode } from '@/lib/store/explorer-store';

/** Fixed corner compass and scale. Shown for the equal-scale north-up view. */
export function NorthScaleOverlay({
  mode,
  km,
  px,
}: {
  mode: CameraMode;
  km: number;
  px: number;
}) {
  if (mode !== 'bird') return null;

  return (
    <>
      <span className="explorer-compass" aria-hidden>
        N ↑
      </span>
      <span className="explorer-scalebar" aria-label={`${km} kilometre scale`}>
        <i style={{ width: px }} />
        {km} km
      </span>
    </>
  );
}
