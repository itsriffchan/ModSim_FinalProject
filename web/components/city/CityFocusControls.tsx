'use client';

import { membershipDisabledReason, hasMembership } from '@/lib/allocation/housing-share';
import type { PresentationPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function CityFocusControls({ payload }: { payload: PresentationPayload }) {
  const focusOn = useExplorerStore((s) => s.geographicFocus);
  const setFocus = useExplorerStore((s) => s.setGeographicFocus);
  const membershipOk = hasMembership(payload);
  const reason = membershipDisabledReason(payload);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
      <label className={`flex items-center gap-2 ${!membershipOk ? 'opacity-60' : ''}`}>
        <input
          type="checkbox"
          checked={focusOn && membershipOk}
          disabled={!membershipOk}
          onChange={(e) => setFocus(e.target.checked)}
        />
        <span>Highlight allocated cells</span>
      </label>
      {!membershipOk && reason ? (
        <span className="text-xs text-amber-800" role="status">
          {reason}
        </span>
      ) : null}
    </div>
  );
}