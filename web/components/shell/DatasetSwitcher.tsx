'use client';

import type { DatasetKey } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

const OPTIONS: { key: DatasetKey; label: string }[] = [
  { key: 'comparison', label: 'A / B / C batch' },
  { key: 'A', label: 'Standalone A' },
  { key: 'B', label: 'Standalone B' },
  { key: 'C', label: 'Standalone C' },
];

export function DatasetSwitcher() {
  const dataset = useExplorerStore((s) => s.dataset);
  const setDataset = useExplorerStore((s) => s.setDataset);

  return (
    <div className="explorer-control-group">
      <label className="explorer-control-label" htmlFor="dataset-select">
        Dataset
      </label>
      <select
        id="dataset-select"
        className="explorer-select"
        value={dataset}
        onChange={(e) => setDataset(e.target.value as DatasetKey)}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}