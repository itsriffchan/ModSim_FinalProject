'use client';

import { useExplorerStore } from '@/lib/store/explorer-store';

export function OverlayKey() {
  const payload = useExplorerStore((s) => s.payload);

  return (
    <section className="explorer-panel-card">
      <h3 className="explorer-panel-heading">Overlay key</h3>
      <ul className="explorer-overlay-key space-y-2 text-sm">
        <li>
          <span className="explorer-swatch explorer-swatch-lgu" aria-hidden />
          LGU boundaries ({payload?.overlays.lgu.length ?? '…'})
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-fault" aria-hidden />
          West Valley Fault
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-epicenter" aria-hidden />
          Assumed epicenter
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-inactive" aria-hidden />
          Inactive grid cell
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-awaiting" aria-hidden />
          Awaiting arrival
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-arrival" aria-hidden />
          {payload?.encoding.arrival_boundary ?? 'Shared arrival boundary'}
        </li>
      </ul>
    </section>
  );
}