'use client';

import { membershipDisabledReason, hasMembership } from '@/lib/allocation/housing-share';
import type { PresentationPayload } from '@/lib/payload/types';
import type { CameraMode } from '@/lib/store/explorer-store';
import { useExplorerStore } from '@/lib/store/explorer-store';

const MODES: { id: CameraMode; label: string }[] = [
  { id: 'bird', label: "Bird's-eye" },
  { id: 'oblique', label: 'Oblique' },
  { id: 'low', label: 'Low angle' },
  { id: 'orbit', label: 'Orbit' },
];

export function CityFocusControls({ payload }: { payload: PresentationPayload }) {
  const focusOn = useExplorerStore((s) => s.geographicFocus);
  const setFocus = useExplorerStore((s) => s.setGeographicFocus);
  const cameraMode = useExplorerStore((s) => s.cameraMode);
  const setCameraMode = useExplorerStore((s) => s.setCameraMode);
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
      <span className="hidden h-4 w-px bg-slate-300 sm:inline" aria-hidden />
      <div className="flex flex-wrap gap-1" role="group" aria-label="Camera mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`rounded px-2 py-1 text-xs ${
              cameraMode === m.id ? 'bg-slate-800 text-white' : 'border border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => setCameraMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="ml-auto rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
        onClick={() => setCameraMode('bird')}
      >
        Reset north-up
      </button>
    </div>
  );
}