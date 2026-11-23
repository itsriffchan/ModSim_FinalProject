'use client';

import { AllocationNote } from '@/components/city/AllocationNote';
import { CityFinalSummary } from '@/components/city/CityFinalSummary';
import { CityFocusControls } from '@/components/city/CityFocusControls';
import { lguRow } from '@/lib/allocation/housing-share';
import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import type { PresentationPayload, ScenarioPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

function useRegionLgu(): {
  payload: PresentationPayload;
  scenario: ScenarioPayload;
  pcode: string;
  name: string;
} | null {
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const lguPcode = useExplorerStore((s) => s.lguPcode);
  if (!payload || !lguPcode) return null;
  const scenarios = normalizeScenarios(payload);
  const scenario =
    scenarioId === 'all' ? scenarios[0] : getScenarioById(payload, scenarioId) ?? scenarios[0];
  if (!scenario) return null;
  return {
    payload,
    scenario,
    pcode: lguPcode,
    name: lguRow(scenario, lguPcode)?.lgu_name ?? lguPcode,
  };
}

export function RegionLguHeading() {
  const focus = useRegionLgu();
  if (!focus) return null;
  return (
    <div className="explorer-city-heading">
      <p className="explorer-eyebrow">City perspective</p>
      <h2 className="text-xl font-semibold">{focus.name}</h2>
    </div>
  );
}

export function RegionLguSide() {
  const focus = useRegionLgu();
  if (!focus) return null;
  return (
    <>
      <CityFinalSummary scenario={focus.scenario} adm3_pcode={focus.pcode} lguName={focus.name} />
      <AllocationNote payload={focus.payload} />
      <CityFocusControls payload={focus.payload} />
    </>
  );
}
