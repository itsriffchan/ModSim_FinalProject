'use client';

import {
  ARRIVAL_EDGE_COLOR,
  GRID_OUTLINE_ARRIVED,
  GRID_OUTLINE_AWAITING,
  GRID_OUTLINE_INACTIVE,
  NO_ACTIVE_CELL_COLOR,
} from '@/lib/basemap/maplibreConfig';
import { NCR_BORDER_COLOR } from '@/lib/map/ncrCamera';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function OverlayKey() {
  const payload = useExplorerStore((s) => s.payload);

  return (
    <section className="explorer-panel-card">
      <h3 className="explorer-panel-heading">Overlay key (Region map)</h3>
      <ul className="explorer-overlay-key space-y-2 text-sm">
        <li>
          <span
            className="explorer-swatch"
            style={{ background: 'linear-gradient(90deg, #f7fbff, #08306b)' }}
            aria-hidden
          />
          Heavy-damage probability on the grid. Buildings use the same cell color when footprints are in view
        </li>
        <li>
          <span
            className="explorer-swatch"
            style={{ backgroundColor: NO_ACTIVE_CELL_COLOR }}
            aria-hidden
          />
          No active grid cell at building centroid
        </li>
        <li>
          <span
            className="explorer-swatch"
            style={{ backgroundColor: GRID_OUTLINE_INACTIVE }}
            aria-hidden
          />
          Inactive grid cell (outline)
        </li>
        <li>
          <span
            className="explorer-swatch"
            style={{ backgroundColor: GRID_OUTLINE_AWAITING }}
            aria-hidden
          />
          Awaiting arrival (outline)
        </li>
        <li>
          <span
            className="explorer-swatch"
            style={{ backgroundColor: GRID_OUTLINE_ARRIVED }}
            aria-hidden
          />
          Arrived cell (outline)
        </li>
        <li>
          <span
            className="explorer-swatch"
            style={{ backgroundColor: ARRIVAL_EDGE_COLOR }}
            aria-hidden
          />
          {payload?.encoding.arrival_boundary ?? 'Shared arrival boundary'}
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-lgu" aria-hidden />
          LGU boundaries ({payload?.overlays.lgu.length ?? '…'})
        </li>
        <li>
          <span
            className="explorer-swatch"
            style={{ width: '1.1rem', borderTop: `4px solid ${NCR_BORDER_COLOR}` }}
            aria-hidden
          />
          NCR boundary
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-fault" aria-hidden />
          West Valley Fault
        </li>
        <li>
          <span className="explorer-swatch explorer-swatch-epicenter" aria-hidden />
          Assumed epicenter
        </li>
      </ul>
    </section>
  );
}