'use client';

import { useExplorerStore } from '@/lib/store/explorer-store';

export function ProbabilityLegend() {
  const payload = useExplorerStore((s) => s.payload);
  const encoding = payload?.encoding;

  const ticks = encoding?.probability_ticks ?? [0, 0.02, 0.05, 0.1];
  const overflow = encoding?.overflow_label ?? '≥10% (saturated on map)';

  return (
    <section className="explorer-panel-card">
      <h3 className="explorer-panel-heading">Heavy-damage probability</h3>
      <div className="explorer-probability-ramp" aria-hidden />
      <div className="explorer-probability-ticks">
        {ticks.map((t) => (
          <span key={t}>{`${(t * 100).toFixed(0)}%`}</span>
        ))}
      </div>
      <p className="text-xs text-[var(--shell-muted)] mt-2 leading-relaxed">
        Shared 0–10% palette on the map; inspected values above 10% retain true probability in
        the cell inspector. {overflow}
      </p>
    </section>
  );
}