'use client';

import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';

import { LguSealMark } from './LguSealMark';

/** Region zoom control: a seal (or monogram) with the saved name under it. */
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
    <section className="explorer-lgu-seal-row" aria-label="LGU selection">
      <h2 className="explorer-lgu-seal-heading">LGU selection</h2>
      <ul className="explorer-lgu-seal-list" data-testid="region-lgu-list">
        <li>
          <button
            type="button"
            className="explorer-lgu-seal-button"
            data-testid="region-lgu-clear"
            aria-pressed={!lguPcode}
            onClick={() => {
              setLguPcode(null);
              setGeographicFocus(false);
            }}
          >
            <span className="explorer-lgu-monogram" aria-hidden="true">
              NCR
            </span>
            <span className="explorer-lgu-seal-name">Whole NCR</span>
          </button>
        </li>
        {lgus.map((lgu) => {
          const selected = lgu.adm3_pcode === lguPcode;
          return (
            <li key={lgu.adm3_pcode}>
              <button
                type="button"
                className="explorer-lgu-seal-button"
                data-testid="region-lgu-option"
                data-pcode={lgu.adm3_pcode}
                aria-pressed={selected}
                onClick={() => {
                  setLguPcode(lgu.adm3_pcode);
                  setGeographicFocus(true);
                }}
              >
                <LguSealMark pcode={lgu.adm3_pcode} name={lgu.lgu_name} />
                <span className="explorer-lgu-seal-name">{lgu.lgu_name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
