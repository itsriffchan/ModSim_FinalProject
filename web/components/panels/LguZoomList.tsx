'use client';

import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';

/** The only Region zoom: choosing a saved LGU frames that outline. */
export function LguZoomList() {
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  const setLguPcode = useExplorerStore((s) => s.setLguPcode);
  const setGeographicFocus = useExplorerStore((s) => s.setGeographicFocus);

  if (!payload) return null;

  const scenarios = normalizeScenarios(payload);
  const scenario =
    scenarioId === 'all' ? scenarios[0] : getScenarioById(payload, scenarioId) ?? scenarios[0];
  const lgus = [...(scenario?.lgu ?? [])].sort((a, b) => a.lgu_name.localeCompare(b.lgu_name));

  return (
    <section className="explorer-panel-card" aria-label="Zoom to an LGU">
      <h3 className="explorer-panel-heading">Zoom to an LGU</h3>
      <p className="text-xs text-[var(--shell-muted)] mb-2 leading-relaxed">
        Scroll zoom is off. Choose a city to frame its saved outline. Playback stays on the
        current frame and spreads the probability fill.
      </p>
      <button
        type="button"
        className="explorer-lgu-zoom-button"
        data-testid="region-lgu-clear"
        aria-pressed={!lguPcode}
        onClick={() => {
          setLguPcode(null);
          setGeographicFocus(false);
        }}
      >
        Whole NCR
      </button>
      <ul className="explorer-lgu-zoom-list" data-testid="region-lgu-list">
        {lgus.map((lgu) => {
          const selected = lgu.adm3_pcode === lguPcode;
          return (
            <li key={lgu.adm3_pcode}>
              <button
                type="button"
                className="explorer-lgu-zoom-button"
                data-testid="region-lgu-option"
                data-pcode={lgu.adm3_pcode}
                aria-pressed={selected}
                onClick={() => {
                  setLguPcode(lgu.adm3_pcode);
                  setGeographicFocus(true);
                }}
              >
                {lgu.lgu_name}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
