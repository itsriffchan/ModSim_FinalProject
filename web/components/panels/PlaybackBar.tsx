'use client';

import { useExplorerStore } from '@/lib/store/explorer-store';

const SPEED_OPTIONS = [0.5, 1, 2, 4, 8];

export function PlaybackBar() {
  const payload = useExplorerStore((s) => s.payload);
  const time = useExplorerStore((s) => s.time);
  const playing = useExplorerStore((s) => s.playing);
  const speed = useExplorerStore((s) => s.speed);
  const setTime = useExplorerStore((s) => s.setTime);
  const setPlaying = useExplorerStore((s) => s.setPlaying);
  const setSpeed = useExplorerStore((s) => s.setSpeed);

  const horizon = payload?.horizon_s ?? 0;

  const togglePlay = () => {
    if (time >= horizon) {
      setTime(0);
    }
    setPlaying(!playing);
  };

  return (
    <section className="explorer-playback" aria-label="Playback controls">
      <button
        type="button"
        className="explorer-btn-primary"
        aria-pressed={playing}
        onClick={togglePlay}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        className="explorer-btn-secondary"
        onClick={() => {
          setPlaying(false);
          setTime(0);
        }}
      >
        Restart
      </button>
      <label className="explorer-playback-time flex-1 min-w-[200px]">
        <span className="sr-only">Simulation time</span>
        <input
          type="range"
          min={0}
          max={horizon || 1}
          step={0.05}
          value={time}
          onChange={(e) => {
            setPlaying(false);
            setTime(Number(e.target.value));
          }}
          className="w-full"
        />
      </label>
      <span className="explorer-clock font-mono text-sm whitespace-nowrap" aria-live="polite">
        t = {time.toFixed(2)} s
      </span>
      <label className="text-xs flex items-center gap-2">
        Speed
        <select
          className="explorer-select py-1"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toFixed(1)}×
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}