'use client';

import type { CameraMode } from '@/lib/store/explorer-store';
import { useExplorerStore } from '@/lib/store/explorer-store';

const MODES: { id: CameraMode; label: string }[] = [
  { id: 'bird', label: "Bird's-eye" },
  { id: 'oblique', label: 'Oblique' },
  { id: 'low', label: 'Low angle' },
  { id: 'orbit', label: 'Orbit' },
];

interface CameraToolbarProps {
  onResetNorth?: () => void;
}

export function CameraToolbar({ onResetNorth }: CameraToolbarProps) {
  const cameraMode = useExplorerStore((s) => s.cameraMode);
  const setCameraMode = useExplorerStore((s) => s.setCameraMode);

  return (
    <div className="explorer-camera-toolbar" role="toolbar" aria-label="Map camera">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`explorer-chip ${cameraMode === m.id ? 'explorer-chip-active' : ''}`}
          aria-pressed={cameraMode === m.id}
          onClick={() => setCameraMode(m.id)}
        >
          {m.label}
        </button>
      ))}
      <button
        type="button"
        className="explorer-chip"
        onClick={() => onResetNorth?.()}
      >
        Reset north
      </button>
    </div>
  );
}