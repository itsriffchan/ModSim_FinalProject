'use client';

import { useEffect } from 'react';

import { useExplorerStore } from '@/lib/store/explorer-store';

/** Advances `time` while playing; stops at horizon. */
export function useExplorerPlayback() {
  const playing = useExplorerStore((s) => s.playing);
  const speed = useExplorerStore((s) => s.speed);
  const horizon = useExplorerStore((s) => s.payload?.horizon_s ?? 0);
  const setTime = useExplorerStore((s) => s.setTime);
  const setPlaying = useExplorerStore((s) => s.setPlaying);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * speed;
      last = now;
      const t = useExplorerStore.getState().time + dt;
      if (t >= horizon) {
        setTime(horizon);
        setPlaying(false);
        return;
      }
      setTime(t);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, horizon, setTime, setPlaying]);
}