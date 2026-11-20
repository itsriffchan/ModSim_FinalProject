# Phase 1: REGION VIEW

## Objective and sequencing

Polish and verify the existing NCR heatmap as the foundation for city focus and comparison. Status: **complete ? 2026-11-20**; see [executed checks and agent visual review](../evidence/view-context/region-view/20261120_region_01/README.md). Follow [the shared workflow](README.md). CITY PERSPECTIVE is ready. The approved REGION VIEW implementation stops at this handoff; city-focus work remains deferred.

## Verified starting state

Source inspection confirms flat unlit contiguous active tiles, gray inactive tiles, saved-onset arrival boundaries, orthographic north-up cameras, linked pan/zoom, individual scenario choices and existing comparison mode. Playback starts paused at origin; restart, speed, scrubbing and north-up reset are wired. Cell inspection shows population, final PGV, current/final probability and separate final losses. NCR counters animate while the 17-row LGU table stays final.

These are source observations, supported by the historical [heatmap verification](../VIEWER-VERIFICATION.md), not new runtime passes. The [historical browser results](../evidence/heatmap/browser_checks.json) and screenshots are baseline evidence. Raised columns, orbiting and a [0,1] palette in older instructions are superseded.

## Required behavior

- Select each available scenario with clear epicenter and duration labels. Independent exports expose only available scenarios and work without comparison data.
- Keep north-up equal scaling, inactive mask, LGU outlines, West Valley Fault, assumed epicenter, north indicator and 5 km scale readable at initial fit and reset. Retain the current visual direction.
- Keep a common 0–10% palette across scenarios and time, with percentage ticks and saturation at ≥10%. Inspection must retain true values above the color limit. Distinguish awaiting arrival from arrived zero probability.
- Calculate presentation progress only as `final_probability * clip((time-onset)/duration,0,1)` using saved onsets. Arrival includes equality at onset. The amber boundary consists of shared active-cell edges between arrived and awaiting cells; no invented circular front, exterior edges or inactive edges.
- Preserve play/pause, restart, backward/forward scrub, speed and stopping at the shared endpoint. Finished panels remain final. Animated NCR deaths and injuries use their separate saved loss columns and the same display fraction; fixed final LGU values never follow playback.
- Preserve cell picking and current/final percentage inspection, the visible assumed-timing disclaimer, settings and provenance. Display expectations as illustrative model outputs, not earthquake forecasts.

## Implementation entry points and constraints

- [Template](../../viewer/template.html), [styles](../../viewer/viewer.css) and [viewer](../../viewer/viewer.js): `buildPanel`, `reset`, `link`, `state`, `update`, `inspect`, `table`, `show`, `setTime` and `render` control the presentation.
- [Payload writer](../../src/write_scenario_viewer.m) and [saved-run exporter](../../export_scenario_viewer.m) embed all resources in standalone HTML; sibling JSON is for inspection only. Keep current MATLAB entry points including [run_all](../../run_all.m), [run_scenario](../../run_scenario.m) and [run_acceptance](../../run_acceptance.m).
- Preserve `window.modsimViewer`: `payload`, `state`, `setTime`, `show`, `inspect`, and the `time`, `playing`, `mode`, `panels`, `frameIntervals` getters. Retain existing mode meanings and data shapes used by browser tests. Any future methods are additive.
- No new payload fields are required for this phase. Keep schema 1 and scalar-to-array scenario normalization. Do not recalculate ground motion, fragility or casualty relationships in JavaScript, or change saved scientific arrays/provenance. Keep vendored offline assets and legacy video behavior.

## Acceptance checks

1. Run the [shared MATLAB export/payload and preservation procedure](README.md#verification-procedure-for-later-phases) for the saved batch and independent exports. Verify cell IDs/order, masks, geometry, population, settings, PGV, onsets, probabilities, separate losses, totals, overlays and provenance against saved state; numeric tolerance is 1e-8 where used by the existing verifier.
2. Run the current offline browser harness on comparison and focused single-export checks on A/B/C. Test zero, first onset, half-duration, intermediate, completion and backward restoration. Compare every sampled displayed probability/counter against saved references; require endpoint counters to match saved NCR totals and all 17 fixed LGU rows, including Pateros, to remain unchanged during playback.
3. Exercise selection, raycast inspection, playback, speed, restart, scrub, pan/zoom/reset and resize. Check north projects up, east right and scale remains equal; check overlays, palette and exact shared-edge arrival logic. Preserve inspection-interface behavior.
4. Open moved standalone HTML offline; require no HTTP(S) requests or JavaScript errors, readable WebGL failure fallback and recorded performance. Inspect screenshots at origin/onset/intermediate/final on desktop and narrow layouts for clipping, legibility and table scrolling.

## Handoff requirements

Record new evidence and visual-review findings using the [shared handoff record](README.md#handoff-record-required-at-each-gate). Explicitly list failures and pending checks; do not reuse historical passes as fresh evidence. Only after all checks and recorded visual review pass, mark REGION VIEW complete and CITY PERSPECTIVE ready. Keep COMPARE blocked. Later phases must rerun REGION VIEW regression checks.
