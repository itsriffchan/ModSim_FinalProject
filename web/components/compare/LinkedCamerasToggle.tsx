'use client';

import { useExplorerStore } from '@/lib/store/explorer-store';

export function LinkedCamerasToggle() {
  const linked = useExplorerStore((s) => s.linkedCameras);
  const setLinked = useExplorerStore((s) => s.setLinkedCameras);

  return (
    <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
      <input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} />
      <span>Linked map pan</span>
    </label>
  );
}