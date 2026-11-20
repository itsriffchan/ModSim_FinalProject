# REGION VIEW implementation and verification

## Summary

Polish the existing offline NCR heatmap and complete the REGION VIEW acceptance gate described in `docs/view-context`. Keep comparison as the default for complete A/B/C exports, as requested. Independent exports open their sole available scenario.

Limit implementation to REGION VIEW and existing comparison regressions. CITY PERSPECTIVE and COMPARE feature work remain deferred.

## Implementation changes

- Retain the blue-gray design, system fonts, vendored scripts and standalone HTML packaging. Refine map framing and north-label spacing so the grid, fault, assumed epicenter and 5 km scale are readable at initial fit and reset on desktop and narrow screens.
- Preserve north-up orientation, equal projected scaling, linked cameras and the shared 0–10% palette. Preserve true inspected probabilities above 10%, distinct awaiting/arrived-zero fills and saved-onset shared-edge boundaries.
- Keep playback paused at origin, separate animated NCR death/injury counters, fixed final LGU rows and the existing controls. Make playback status accurately distinguish paused, playing and complete states.
- Clear inspection when switching away from its selected scenario, restoring the selection prompt; keep inspection live while scrubbing a visible scenario.
- Keep timing assumptions, unvalidated-transfer labels, scenario settings and provenance visible and readable.

No payload additions or public API changes are planned. Preserve schema 1, scalar-to-array scenario normalization and every existing `window.modsimViewer` method/getter, including `show('all')`. Preserve MATLAB entry points and legacy video behavior.

## Verification

Extend `tools/test_viewer.cjs` and `tests/verify_viewer_payload.m` where coverage is incomplete:

- Compare rendered counters and inspected values against saved references, accounting for display rounding; retain the `1e-8` tolerance for underlying numerical values.
- Check origin, onset equality, half-duration, intermediate, completion and backward restoration. Independently reconstruct expected shared active-cell boundary segments from saved grid geometry and onsets.
- Verify all 17 LGU rows, including Pateros, against saved final values and confirm they remain unchanged throughout playback.
- Exercise scenario selection, real cell picking, play/pause, speed, restart, scrubbing, pan/zoom/reset and resizing. Verify north/east projection and equal geographic scale.
- Test batch and independent saved A/B/C exports. Open each HTML alone from a directory without sibling JSON, under `file://` with networking offline.
- Require zero HTTP(S) requests, zero JavaScript errors, readable WebGL fallback and at least 30 fps during comparison on the recorded machine.
- Use an isolated browser fixture to verify color saturation above 10% while inspection retains the true value; leave saved scientific data untouched.

## Preservation and completion gate

- Export preserved copies of the existing acceptance batch and independent runs using MATLAB R2026b. Reuse installed browser tooling without adding dependencies.
- Hash source and working-copy scientific MAT/CSV files before and after export; require byte preservation. Verify payload identities, geometry, masks, population, PGV, probabilities, losses, onsets, settings, epicenters, overlays and original provenance against saved state.
- Record fresh commands, environment, fingerprints, numerical results, screenshots and dated agent visual findings under `docs/evidence/view-context/region-view/<run-id>/`.
- Review origin, arrival, intermediate and final states on desktop and narrow layouts, including label clipping, overlay legibility and table scrolling.
- Mark REGION VIEW complete only after every required check and visual review passes. Otherwise record blockers and next actions. On success, mark CITY PERSPECTIVE ready and leave COMPARE blocked.

Assumptions: preserve existing scientific outputs and historical evidence, retain current comparison behavior, and stop this implementation at the REGION VIEW handoff.
