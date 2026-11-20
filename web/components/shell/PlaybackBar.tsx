'use client';

import { fmt } from '@/lib/display/format';
import { useExplorerStore } from '@/lib/store/explorer-store';

export function PlaybackBar() {
  const time = useExplorerStore((s) => s.time);
  const horizon = useExplorerStore((s) => s.payload?.horizon_s ?? 0);
  const playing = useExplorerStore((s) => s.playing);
  const speed = useExplorerStore((s) => s.speed);
  const setTime = useExplorerStore((s) => s.setTime);
  const setPlaying = useExplorerStore((s) => s.setPlaying);
  const setSpeed = useExplorerStore((s) => s.setSpeed);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm">
      <button
        type="button"
        className="rounded bg-slate-800 px-3 py-1 text-white hover:bg-slate-700"
        onClick={() => setPlaying(!playing)}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        className="rounded border border-slate-300 px-3 py-1 hover:bg-slate-50"
        onClick={() => {
          setPlaying(false);
          setTime(0);
        }}
      >
        Restart
      </button>
      <label className="flex items-center gap-2">
        <span className="text-slate-600">Time</span>
        <input
          type="range"
          min={0}
          max={horizon}
          step={0.1}
          value={time}
          onChange={(e) => setTime(Number(e.target.value))}
          className="w-48"
        />
        <span aria-live="polite">{fmt(time)} s</span>
      </label>
      <label className="flex items-center gap-2">
        <span className="text-slate-600">Speed</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="rounded border border-slate-300 px-2 py-1"
        >
          {[0.5, 1, 2, 4].map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}