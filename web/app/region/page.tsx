'use client';

import { RegionOsm3dMap } from '@/components/map/RegionOsm3dMap';
import { CellInspector } from '@/components/panels/CellInspector';
import { DisclaimerStrip } from '@/components/panels/DisclaimerStrip';
import { OverlayKey } from '@/components/panels/OverlayKey';
import { PlaybackBar } from '@/components/panels/PlaybackBar';
import { ProbabilityLegend } from '@/components/panels/ProbabilityLegend';
import { RegionSummary } from '@/components/panels/RegionSummary';
import { AppHeader } from '@/components/shell/AppHeader';
import { DatasetSwitcher } from '@/components/shell/DatasetSwitcher';
import { ScenarioSelector } from '@/components/shell/ScenarioSelector';
import {
  ExplorerProviders,
  useExplorerContext,
} from '@/components/shell/ExplorerProviders';
import { ViewTabs } from '@/components/shell/ViewTabs';

function RegionView() {
  const { loading, error } = useExplorerContext();

  return (
    <div className="explorer-shell flex flex-col min-h-full flex-1">
      <DisclaimerStrip />
      <AppHeader />
      <ViewTabs />
      <div className="explorer-toolbar">
        <ScenarioSelector />
        <DatasetSwitcher />
      </div>

      {error && (
        <div className="explorer-error-banner" role="alert">
          {error}
        </div>
      )}

      <main className="explorer-main flex-1">
        <div className="explorer-region-grid explorer-region-grid--map-focused">
          <div className="explorer-map-column explorer-map-column--fill">
            <RegionOsm3dMap />
            <PlaybackBar />
          </div>
          <aside className="explorer-side-column space-y-3">
            <RegionSummary />
            <ProbabilityLegend />
            <OverlayKey />
            <CellInspector />
          </aside>
        </div>
        {loading && (
          <p className="text-sm text-[var(--shell-muted)] mt-2" aria-live="polite">
            Loading saved presentation payload…
          </p>
        )}
      </main>
    </div>
  );
}

export default function RegionPage() {
  return (
    <ExplorerProviders>
      <RegionView />
    </ExplorerProviders>
  );
}