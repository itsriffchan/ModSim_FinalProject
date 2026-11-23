'use client';

import { hasMembership, membershipDisabledReason } from '@/lib/allocation/housing-share';
import { normalizeScenarios } from '@/lib/payload/load';
import type { PresentationPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function GeographicSelector({ payload }: { payload: PresentationPayload }) {
  const setFocusCity = useExplorerStore((s) => s.setGeographicFocus);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  const setLguPcode = useExplorerStore((s) => s.setLguPcode);

  const lgus = normalizeScenarios(payload)[0]?.lgu ?? [];
  const membershipOk = hasMembership(payload);
  const reason = membershipDisabledReason(payload);
  const cityOn = Boolean(lguPcode);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="sr-only">Geographic focus</legend>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="geo-focus"
            checked={!cityOn}
            onChange={() => {
              setFocusCity(false);
              setLguPcode(null);
            }}
          />
          Whole NCR
        </label>
        <label className={`flex items-center gap-1 ${lgus.length === 0 ? 'opacity-50' : ''}`}>
          <input
            type="radio"
            name="geo-focus"
            checked={cityOn}
            disabled={lgus.length === 0}
            onChange={() => {
              setFocusCity(true);
              if (!lguPcode && lgus[0]) setLguPcode(lgus[0].adm3_pcode);
            }}
          />
          City focus
        </label>
        {cityOn ? (
          <select
            value={lguPcode ?? ''}
            onChange={(e) => {
              setFocusCity(true);
              setLguPcode(e.target.value);
            }}
            className="rounded border border-slate-300 px-2 py-1"
            aria-label="LGU for city focus"
          >
            {lgus.map((lgu) => (
              <option key={lgu.adm3_pcode} value={lgu.adm3_pcode}>
                {lgu.lgu_name}
              </option>
            ))}
          </select>
        ) : null}
      </fieldset>
      {!membershipOk && reason ? (
        <span className="text-xs text-amber-800" role="status">
          {reason} The saved outline can still frame the map.
        </span>
      ) : null}
    </div>
  );
}