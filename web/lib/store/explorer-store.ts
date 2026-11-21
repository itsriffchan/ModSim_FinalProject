import { create } from 'zustand';

import { displayState } from '@/lib/display/state';
import { normalizeScenarios } from '@/lib/payload/load';
import type { DatasetKey, PresentationPayload, ScenarioPayload, ScenarioViewId } from '@/lib/payload/types';

export type ExplorerView = 'region' | 'city' | 'compare';

export type CameraMode = 'bird' | 'oblique' | 'low' | 'orbit';

export interface SelectedCell {
  scenarioId: string;
  cellIndex: number;
}

export interface ExplorerState {
  dataset: DatasetKey;
  payload: PresentationPayload | null;
  scenarioId: ScenarioViewId;
  time: number;
  playing: boolean;
  speed: number;
  selectedCell: SelectedCell | null;
  cameraMode: CameraMode;
  view: ExplorerView;
  linkedCameras: boolean;
  geographicFocus: boolean;
  lguPcode: string | null;
  setDataset: (dataset: DatasetKey) => void;
  setPayload: (payload: PresentationPayload | null) => void;
  setScenarioId: (id: ScenarioViewId) => void;
  setTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setSelectedCell: (cell: SelectedCell | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setView: (view: ExplorerView) => void;
  setLinkedCameras: (linked: boolean) => void;
  setGeographicFocus: (focus: boolean) => void;
  setLguPcode: (pcode: string | null) => void;
  activeScenarios: () => ScenarioPayload[];
  stateAt: (scenario: ScenarioPayload, t?: number) => ReturnType<typeof displayState>;
}

function clampTime(payload: PresentationPayload | null, t: number): number {
  const horizon = payload?.horizon_s ?? 0;
  return Math.min(horizon, Math.max(0, Number(t)));
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  dataset: 'comparison',
  payload: null,
  scenarioId: 'all',
  time: 0,
  playing: false,
  speed: 2,
  selectedCell: null,
  cameraMode: 'low',
  view: 'region',
  linkedCameras: true,
  geographicFocus: true,
  lguPcode: null,
  setDataset: (dataset) => set({ dataset, payload: null, time: 0, playing: false }),
  setPayload: (payload) =>
    set({
      payload,
      time: 0,
      playing: false,
      speed: payload?.timing.playback_speed ?? 2,
    }),
  setScenarioId: (scenarioId) => set({ scenarioId, selectedCell: null }),
  setTime: (time) => {
    const payload = get().payload;
    set({ time: clampTime(payload, time) });
  },
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  setSelectedCell: (selectedCell) => set({ selectedCell }),
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setView: (view) => set({ view }),
  setLinkedCameras: (linkedCameras) => set({ linkedCameras }),
  setGeographicFocus: (geographicFocus) => set({ geographicFocus }),
  setLguPcode: (lguPcode) => set({ lguPcode }),
  activeScenarios: () => {
    const { payload, scenarioId } = get();
    if (!payload) return [];
    const scenarios = normalizeScenarios(payload);
    if (scenarioId === 'all') return scenarios;
    return scenarios.filter((s) => s.id === scenarioId);
  },
  stateAt: (scenario, t) => displayState(scenario, t ?? get().time),
}));