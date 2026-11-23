'use client';

import { RegionOsm3dMap } from '@/components/map/RegionOsm3dMap';
import { CellInspector } from '@/components/panels/CellInspector';
import { LguZoomList } from '@/components/panels/LguZoomList';
import { OverlayKey } from '@/components/panels/OverlayKey';
import { PlaybackBar } from '@/components/panels/PlaybackBar';
import { ProbabilityLegend } from '@/components/panels/ProbabilityLegend';
import { RegionLguHeading, RegionLguSide } from '@/components/panels/RegionLguFocus';
import { RegionSummary } from '@/components/panels/RegionSummary';
import { DatasetSwitcher } from '@/components/shell/DatasetSwitcher';
import { ExplorerFrame } from '@/components/shell/ExplorerFrame';
import { ExplorerProviders } from '@/components/shell/ExplorerProviders';
import { ScenarioSelector } from '@/components/shell/ScenarioSelector';

function RegionView() {
  return (
    <ExplorerFrame
      toolbar={
        <>
          <ScenarioSelector />
          <DatasetSwitcher />
        </>
      }
    >
      <LguZoomList />
      <div className="explorer-region-grid explorer-region-grid--map-focused">
        <div className="explorer-map-column explorer-map-column--fill">
          <RegionLguHeading />
          <RegionOsm3dMap />
          <PlaybackBar />
        </div>
        <aside className="explorer-side-column space-y-3">
          <RegionSummary />
          <RegionLguSide />
          <ProbabilityLegend />
          <OverlayKey />
          <CellInspector />
        </aside>
      </div>
    </ExplorerFrame>
  );
}

export default function RegionPage() {
  return (
    <ExplorerProviders>
      <RegionView />
    </ExplorerProviders>
  );
}
