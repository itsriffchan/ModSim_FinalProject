# Ordered offline viewer handoff

Read this entry point, then [REGION VIEW](REGION-VIEW.md), [CITY PERSPECTIVE](CITY-PERSPECTIVE.md), and [COMPARE](COMPARE.md). These names specify implementation order, not required navigation labels. This handoff implements the approved context-writing plan; it does not implement viewer features.

| Phase | Current status | Completion gate |
| --- | --- | --- |
| REGION VIEW | Complete ? [fresh evidence](../evidence/view-context/region-view/20261120_region_01/README.md) | Verify and polish the existing NCR view; record payload checks, offline browser checks and visual review. |
| CITY PERSPECTIVE | Ready; deferred by approved implementation scope | Verify all 17 LGUs, saved allocation semantics, final summaries and focused maps; rerun REGION VIEW regressions and record visual review. |
| COMPARE | Blocked by CITY PERSPECTIVE gate | Verify saved A/B/C comparison and prior-phase regressions; record visual review. |

Do not start a later phase until its prerequisite gate passes. Record failures and unexecuted checks as blockers or pending, with owners/next actions. Passing a gate permits continuation without another approval step. Existing comparison controls may remain available while earlier phases are completed.

## Confirmed requirements

- Extend the current standalone offline HTML and blue-gray cartographic style. Retain the existing technology, vendored assets, installed system fonts and MATLAB entry points. No framework migration, dependency installation or scientific-model revision is part of this handoff.
- Keep saved geometry, identities, masks, population, PGV, probabilities, separate death/injury arrays, onsets, settings and original provenance unchanged. JavaScript performs presentation interpolation only. Preserve schema 1 and `window.modsimViewer` compatibility, including old payloads without future optional fields.
- Keep north up, equal projected scaling (EPSG:32651), fault and assumed epicenter overlays, and the shared 0–10% sequential probability palette. Saturate colors at 10% without changing inspected numbers. Keep assumed-timing and unvalidated-transfer labels visible.
- Support independent single-scenario exports as well as complete A/B/C batches. Include all 17 LGUs, including Pateros. Default city summaries to saved final LGU population and separate expected deaths/injuries; city animation is outside the initial requirement.
- A is Pasig/20 s; B is Pasig/40 s; C is Muntinlupa/40 s. Explain A/B as assumed duration sensitivity and B/C as location comparison at equal duration. Use actual saved outputs; do not impose B/C equality or exaggerate differences.

## Evidence and reading references

Source inspection for this handoff (2026-11-20) confirms the current exporter, viewer controls, inspection interface and allocation code listed in the phase files. This is distinct from executed runtime verification.

- [Current heatmap verification](../VIEWER-VERIFICATION.md) is the current presentation baseline. Its [browser evidence](../evidence/heatmap/browser_checks.json) reports 26 passing checks, zero HTTP(S) requests, zero JavaScript errors and approximately 60 fps. Its [preservation record](../evidence/heatmap/preservation_checks.json) reports 182 unchanged scientific MAT/CSV files and eight checked presentation manifests. These are historical execution records, not fresh runs by this documentation task.
- [Current partial screenshot](../evidence/heatmap/partial.png), [final comparison](../evidence/heatmap/final.png), [individual A](../evidence/heatmap/A_final.png) and [mobile](../evidence/heatmap/mobile.png) accompany that record. The verification describes agent visual review, not human signoff.
- [Viewer payload and offline operation](../../viewer/README.md), [exporter](../../export_scenario_viewer.m), [payload writer](../../src/write_scenario_viewer.m), [payload verification](../../tests/verify_viewer_payload.m) and [browser harness](../../tools/test_viewer.cjs) define the implementation starting point.
- [Historical brief](../VIEWER-BRIEF.md) retains raised-column, orbiting and full-range probability instructions. Those parts, and the oblique-camera descriptions in [prior verification](../evidence/heatmap/prior-viewer-verification.md), are superseded by the current heatmap verification. Preserve those historical files.
- [Assumptions](../ASSUMPTIONS.md), [data provenance](../data_sources.md) and [scenario plan](../SCENARIO-PLAN.md) supply scientific context. Follow the current code and saved outputs where older prose describes superseded presentation behavior.

## Verification procedure for later phases

Run commands from the repository root. In MATLAB, use an existing saved batch with `prepared/prepared.mat`, scenario `state.mat` and `animation_data.mat`; export presentation artifacts without recalculating science:

```matlab
addpath('src','tests');
runRoot = fullfile('results','runs','viewer_acceptance_20261120','batch');
export_scenario_viewer(runRoot);
verify_viewer_payload(runRoot);
```

Hash scientific MAT/CSV files before and after export and require byte preservation. The example uses an existing historical batch; retain prior evidence and use a preserved copy when needed. Repeat payload verification on an independent saved run, such as `results/runs/viewer_acceptance_20261120/independent_1_C`, and test independent A/B exports too. A two-scenario partial batch is not an accepted exporter input.

Use the existing offline browser harness on the combined viewer, with locally available tooling:

```text
node tools/test_viewer.cjs <path-to-playwright-core> <viewer.html> <evidence-directory> [browser-executable]
```

Replace angle-bracket arguments with actual paths; this command does not install dependencies. The current harness assumes A/B/C comparison and is not a complete single-scenario or city test. Add focused checks for those paths during their implementation phases. Open each exported HTML alone under `file://`, moved away from its sibling JSON, with networking offline. Require zero HTTP(S) requests and JavaScript errors, readable WebGL fallback, responsive controls and at least 30 fps on the recorded machine during comparison.

If MATLAB runner/dispatch code changes, use [run_acceptance](../../run_acceptance.m) in a fresh destination and [integration verification](../../tools/verify_viewer_integration.m) with its documented completed-acceptance, prior-batch and fresh-video destinations. Preserve explicit legacy video dispatch. Presentation-only changes still require payload and scientific preservation checks; broad scientific recalculation is not the default.

For each phase, create a new evidence directory under `docs/evidence/view-context/` (for example `region-view/<run-id>/`) and record commands, inputs, source fingerprints, environment, numeric tolerances, pass/fail results, pending checks and screenshot paths. Record reviewer/date and concrete visual findings for origin, arrival, intermediate and final states, desktop and narrow layouts. Screenshots alone do not establish numeric correctness. No later-phase implementation checks were executed by this documentation task; all such gates remain pending.

## Handoff record required at each gate

Update the phase status here with evidence links only after its checks and recorded visual review pass. Include changed entry points, schema additions and compatibility results, scientific preservation evidence, remaining issues and the next permitted phase. Recheck completed phases after subsequent changes; a regression blocks further progression until resolved.

## REGION VIEW handoff ? 2026-11-20

REGION VIEW is complete. [Executed evidence and agent visual review](../evidence/view-context/region-view/20261120_region_01/README.md) record MATLAB R2026b payload passes, 129 unchanged scientific MAT/CSV files in each source/copy tree, seven preserved scientific/provenance payloads, 143 browser assertions across comparison and independent A/B/C, approximately 60 fps, and zero HTTP(S) requests or JS errors. Viewer JS/CSS refine fit/labels, status and inspection clearing; no schema, API, exporter, MATLAB entry point or scientific-model change was made. CITY PERSPECTIVE is ready for a separate implementation; COMPARE remains blocked by its completion. This approved task stops at the REGION VIEW handoff.
