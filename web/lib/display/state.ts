import type { ScenarioPayload } from '@/lib/payload/types';

export interface DisplayState {
  damage: number[];
  counts: [number, number];
}

export function fraction(t: number, onset: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(1, Math.max(0, (t - onset) / duration));
}

/** Port of viewer.js `state(s, t)` — display interpolation only. */
export function displayState(s: ScenarioPayload, t: number): DisplayState {
  const damage: number[] = [];
  let deaths = 0;
  let injuries = 0;
  for (let i = 0; i < s.cell_id.length; i++) {
    const f = fraction(t, s.onset_s[i], s.duration_s);
    const d = f * s.final_heavy[i];
    damage.push(d);
    deaths += f * s.final_losses[i][0];
    injuries += f * s.final_losses[i][1];
  }
  return { damage, counts: [deaths, injuries] };
}