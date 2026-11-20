'use client';

import { CAMERA_LIMITS, headingDeg, tiltFromVerticalDeg } from '@/lib/map/cameraLimits';
import type { CameraMode } from '@/lib/store/explorer-store';

function deg(n: number): string {
  return `${Math.round(n)}°`;
}

export function MapNavigationLegend({
  mode,
  polar,
  azimuth,
}: {
  mode: CameraMode;
  polar: number;
  azimuth: number;
}) {
  const limit = CAMERA_LIMITS[mode];
  const tilt = tiltFromVerticalDeg(polar);
  const tiltMin = tiltFromVerticalDeg(limit.polarMin);
  const tiltMax = tiltFromVerticalDeg(limit.polarMax);
  const head = headingDeg(azimuth);
  const headMin = headingDeg(limit.azimuthMin);
  const headMax = headingDeg(limit.azimuthMax);

  const tiltLine = limit.rotate
    ? `Tilt ${deg(tilt)} (allowed ${deg(tiltMin)}–${deg(tiltMax)})`
    : 'Tilt locked at 0° (top-down, equal scale)';
  const headLine = limit.rotate
    ? `Heading ${deg(head)} (allowed ${deg(headMin)} to ${deg(headMax)}, 0° is north)`
    : 'Heading locked north';

  return (
    <aside className="explorer-map-nav" aria-label="How to navigate the map">
      <p className="explorer-map-nav-title">Navigate</p>
      <ul>
        <li>Drag — pan</li>
        <li>Scroll — zoom</li>
        <li>
          {limit.rotate
            ? 'Right-drag — tilt and turn, inside the limits below'
            : 'Right-drag — off in bird’s-eye (rotation locked)'}
        </li>
        <li>Reset north — heading 0° and this view’s default tilt</li>
      </ul>
      <p className="explorer-map-nav-limits">
        {tiltLine}
        <br />
        {headLine}
      </p>
      <p className="explorer-map-nav-note">
        {mode === 'bird'
          ? 'Bird’s-eye keeps north up and equal projected scale.'
          : 'Oblique, low, and orbit are perspective. Screen scale is not equal.'}
      </p>
    </aside>
  );
}
