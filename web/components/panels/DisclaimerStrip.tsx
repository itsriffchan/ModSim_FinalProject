'use client';

import { useExplorerStore } from '@/lib/store/explorer-store';

export function DisclaimerStrip() {
  const payload = useExplorerStore((s) => s.payload);
  const disclaimer =
    payload?.timing.disclaimer ??
    'Illustrative presentation of saved model outputs — not an earthquake forecast.';

  return (
    <p className="explorer-disclaimer" role="note">
      {disclaimer}
    </p>
  );
}