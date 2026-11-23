'use client';

import { hasMembership } from '@/lib/allocation/housing-share';
import type { PresentationPayload } from '@/lib/payload/types';

export function AllocationNote({ payload }: { payload: PresentationPayload }) {
  if (!hasMembership(payload)) {
    return (
      <p className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
        Casualty allocation by occupied-housing-unit share is not in this payload. City highlights and allocated
        cell inspection require a re-export with <code className="font-mono">membership</code> metadata.
      </p>
    );
  }

  return (
    <p className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
      Highlighted cells follow saved housing-unit shares within each cell (not dominant-LGU assignment). Cells
      crossing LGU boundaries may contribute fractionally to each LGU; final city totals remain the saved LGU table.
    </p>
  );
}