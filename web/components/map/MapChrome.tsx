'use client';

import type { CameraMode } from '@/lib/store/explorer-store';

const MODE_LABEL: Record<CameraMode, string> = {
  bird: "Bird's-eye",
  oblique: 'Oblique (perspective)',
  low: 'Low angle (perspective)',
  orbit: 'Orbit (perspective)',
};

export function MapNorthBadge() {
  return (
    <span
      className="pointer-events-none absolute left-3 top-3 rounded bg-slate-900/75 px-2 py-1 text-xs font-medium text-white"
      aria-hidden
    >
      N ↑
    </span>
  );
}

export function MapScaleBadge({ km = 5 }: { km?: number }) {
  return (
    <span
      className="pointer-events-none absolute bottom-3 left-3 rounded bg-slate-900/75 px-2 py-1 text-xs text-white"
      aria-hidden
    >
      {km} km
    </span>
  );
}

export function MapCameraLabel({ mode }: { mode: CameraMode }) {
  const perspective = mode !== 'bird';
  return (
    <p className="text-[11px] text-slate-600">
      {MODE_LABEL[mode]}
      {perspective ? ' · equal projected scale not preserved' : ' · north-up equal projected scale'}
    </p>
  );
}