'use client';

import { hasMembership, membershipDisabledReason } from '@/lib/allocation/housing-share';
import { normalizeScenarios } from '@/lib/payload/load';
import type { PresentationPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function GeographicSelector({ payload }: { payload: PresentationPayload }) {
  const focusCity = useExplorerStore((s) => s.geographicFocus);
  const setFocusCity = useExplorerStore((s) => s.setGeographicFocus);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  const setLguPcode = useExplorerStore((s) => s.setLguPcode);

  const lgus = normalizeScenarios(payload)[0]?.lgu ?? [];
  const membershipOk = hasMembership(payload);
  const reason = membershipDisabledReason(payload);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="sr-only">Geographic focus</legend>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="geo-focus"
            checked={!focusCity || !membershipOk}
            onChange={() => {
              setFocusCity(false);
              setLguPcode(null);
            }}
          />
          Whole NCR
        </label>
        <label className={`flex items-center gap-1 ${!membershipOk ? 'opacity-50' : ''}`}>
          <input
            type="radio"
            name="geo-focus"
            checked={focusCity && membershipOk}
            disabled={!membershipOk}
            onChange={() => setFocusCity(true)}
          />
          City focus
        </label>
        {focusCity && membershipOk ? (
          <select
            value={lguPcode ?? lgus[0]?.adm3_pcode ?? ''}
            onChange={(e) => setLguPcode(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
            aria-label="LGU for city focus"
          >
            {lgus.map((l) => (
              <option key={l.adm3_pcode} value={l.adm3_pcode}>
                {l.lgu_name}
              </option>
            ))}
          </select>
        ) : null}
      </fieldset>
      {!membershipOk && reason ? (
        <span className="text-xs text-amber-800" role="status">
          {reason}
        </span>
      ) : null}
    </div>
  );
}