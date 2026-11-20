import { validatePresentationPayload } from './validate';
import type { DatasetKey, PresentationPayload, ScenarioPayload } from './types';

export function normalizeScenarios(
  payload: PresentationPayload,
): ScenarioPayload[] {
  return Array.isArray(payload.scenarios) ? payload.scenarios : [payload.scenarios];
}

export function getScenarioById(
  payload: PresentationPayload,
  id: string,
): ScenarioPayload | undefined {
  return normalizeScenarios(payload).find((s) => s.id === id);
}

export async function fetchPresentationPayload(
  dataset: DatasetKey,
  init?: RequestInit,
): Promise<PresentationPayload> {
  const res = await fetch(`/data/${dataset}/presentation_payload.json`, {
    ...init,
    cache: init?.cache ?? 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to load ${dataset} payload: HTTP ${res.status}`);
  }
  const json: unknown = await res.json();
  return validatePresentationPayload(json);
}

export async function fetchDataManifest(): Promise<unknown> {
  const res = await fetch('/data/manifest.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load data manifest: HTTP ${res.status}`);
  }
  return res.json();
}