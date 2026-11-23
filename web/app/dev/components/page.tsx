import Link from 'next/link';

const FAMILIES = [
  {
    title: 'Shell',
    items: [
      'AppHeader',
      'ViewTabs',
      'ScenarioSelector',
      'DatasetSwitcher',
      'ProvenanceDialog',
      'ExplorerProviders',
    ],
  },
  {
    title: 'Map',
    items: [
      'MapCanvas',
      'HeatmapLayer',
      'Overlays',
      'IllustrativeScenery',
      'PlaceLabels',
      'CameraToolbar',
      'MapFallback',
      'NorthScaleOverlay',
    ],
  },
  {
    title: 'Panels',
    items: [
      'RegionSummary',
      'LguTotalsDialog',
      'ProbabilityLegend',
      'OverlayKey',
      'CellInspector',
      'PlaybackBar',
      'DisclaimerStrip',
    ],
  },
];

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="p-8">
        <p>Not available in production builds.</p>
        <Link href="/region" className="text-[var(--shell-accent)] underline mt-2 inline-block">
          Back to region view
        </Link>
      </div>
    );
  }

  return (
    <div className="explorer-shell min-h-full p-8">
      <header className="mb-6">
        <p className="explorer-eyebrow">Development</p>
        <h1 className="explorer-title text-2xl">Component families</h1>
        <Link href="/region" className="text-sm text-[var(--shell-accent)] underline mt-2 inline-block">
          Open region view
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {FAMILIES.map((family) => (
          <section key={family.title} className="explorer-panel-card">
            <h2 className="explorer-panel-heading">{family.title}</h2>
            <ul className="mt-3 space-y-1 text-sm font-mono text-[var(--shell-muted)]">
              {family.items.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}