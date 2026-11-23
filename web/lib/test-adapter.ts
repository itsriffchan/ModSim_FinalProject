import type { DisplayState } from '@/lib/display/state';
import type { ExplorerView, CameraMode } from '@/lib/store/explorer-store';
import type { PresentationPayload, ScenarioPayload, ScenarioViewId } from '@/lib/payload/types';

/** Browser test hook for the Next.js explorer (parallel to standalone `window.modsimViewer`). */
export interface ModsimExplorer {
  payload: PresentationPayload;
  state: (s: ScenarioPayload, t: number) => DisplayState;
  setTime: (t: number) => void;
  setPlaying: (playing: boolean) => void;
  setScenarioId: (id: ScenarioViewId) => void;
  setView: (view: ExplorerView) => void;
  setCameraMode: (mode: CameraMode) => void;
  readonly time: number;
  readonly playing: boolean;
  readonly scenarioId: ScenarioViewId;
  readonly view: ExplorerView;
  readonly cameraMode: CameraMode;
}

declare global {
  interface Window {
    modsimExplorer?: ModsimExplorer;
  }
}

export {};