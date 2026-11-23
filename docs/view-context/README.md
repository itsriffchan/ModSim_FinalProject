# NCR scenario explorer: Next.js handoff

## Objective and design reference

Refactor the existing presentation into a **Next.js website** implementing the three views in the [supplied design reference](design-reference.png): Region, City perspectives, and Compare. The reference is a visual and interaction target, including its blue-gray application shell, scenario controls, map-led layout, overlays, playback, city sidebar and linked comparison. It is an illustrative concept, not evidence that pictured buildings, terrain, labels or camera angles correspond to measured data. Implement the controls and states as functioning features, not a static screenshot.

This user clarification supersedes the earlier offline-only/no-framework-migration scope. The old standalone viewer remains a useful scientific and functional baseline. Preserve it and its MATLAB export/legacy video entry points unless a later explicit instruction authorizes replacement. Do not assume a Next.js deployment, internet access, or standalone file packaging is already decided: document what the implementation actually supports and preserve the current offline workflow. Do not claim the new app works offline until tested.

| Phase | Next.js status | Gate |
| --- | --- | --- |
| [REGION VIEW](REGION-VIEW.md) | Implemented (`web/app/region`) | Evidence `docs/evidence/view-context/nextjs/20261120_nextjs_01/`. |
| [CITY PERSPECTIVE](CITY-PERSPECTIVE.md) | Implemented (`web/app/city/[pcode]`) | Same evidence; membership re-export optional for focus. |
| [COMPARE](COMPARE.md) | Implemented (`web/app/compare`) | Same evidence; three-panel sync. |

Follow REGION VIEW -> CITY PERSPECTIVE -> COMPARE. Complete and record each phase's checks and visual review before starting the next; passing a gate permits continuation without another approval. The previously completed standalone REGION VIEW is a baseline, **not completion of the Next.js region view**. The user's goal is all three views, not another stop after region.

## Scientific and presentation contract

- Keep saved geometry, identities, active mask, population, PGV, probabilities, separate losses, onsets, scenario settings, epicenters, overlays and original provenance. JavaScript may interpolate saved presentation values; it must not recreate or change scientific relationships. Preserve raw data and scientific MAT/CSV bytes.
- A = Pasig, 20 s; B = Pasig, 40 s; C = Muntinlupa, 40 s. A/B is an **assumed duration sensitivity experiment**; B/C compares locations at equal duration. Do not impose equality between saved B/C results. Clearly label unvalidated transfer, assumed timing and illustrative outputs; they are not forecasts.
- Maintain a shared 0-10% heavy-damage probability palette with saturation at 10%, but retain true inspected probabilities. Preserve distinct inactive, awaiting and arrived-zero states and shared active-cell arrival edges. Keep separate expected deaths and nonfatal injuries and fixed saved final LGU totals, including Pateros.
- The reference requests bird's-eye, oblique, low-angle and orbit interactions. Implement meaningful camera controls, with a north-up equal-scale geographic view and north reset; do not imply oblique perspective preserves equal screen scale. Terrain and buildings may be illustrative and must be explicitly labeled. Do not invent a verified building inventory, elevations, geographic boundaries or damage values. Keep data overlays spatially registered to the saved projected geometry; document any imagery, terrain, building data, licenses, and offline dependencies.
- Preserve schema 1 and support scalar and array scenarios. Keep the existing standalone `window.modsimViewer` interface and exporter functional. For the Next.js app, document any adapter or compatibility interface rather than claiming that the old browser harness automatically applies. Any additive metadata needs documented provenance, backward compatibility, and saved-state verification; absence must not silently become zero or fabricated data.

## Starting points and verification

The existing [viewer](../../viewer/README.md), [exporter](../../export_scenario_viewer.m), [payload writer](../../src/write_scenario_viewer.m), [payload verifier](../../tests/verify_viewer_payload.m), and [browser harness](../../tools/test_viewer.cjs) contain working reference behavior. The [prior REGION VIEW evidence](../evidence/view-context/region-view/20261120_region_01/README.md) covers the standalone viewer only; retain it as historical baseline, not proof of Next.js behavior. [Assumptions](../ASSUMPTIONS.md), [data provenance](../data_sources.md), and [scenario plan](../SCENARIO-PLAN.md) describe the model.

Use current Next.js documentation via Context7 when implementing framework-specific setup and APIs. Work from preserved copies of the saved batch and independent A/B/C runs; hash source and working-copy scientific MAT/CSV before and after export and require byte preservation. Validate saved payload identities, geometry, masks, population, PGV, probabilities, losses, onset, settings, epicenters, overlays and provenance, with 1e-8 numerical tolerance where applicable. Do not recalculate science merely to build the UI.

Adapt or extend browser tests for the Next.js app and retain standalone regressions. Verify real navigation, scenario selection, playback, cell picking, geographic focus, cameras, responsive layouts and failure states. Test actual displayed values against saved references, not mock values. Exercise batch and independent A/B/C data; record network requirements and, if offline support is implemented, verify it explicitly. Require no unexplained JavaScript errors, a readable graphics fallback, and record comparison performance (target at least 30 fps on the test machine). Where maps are presented as geographic, verify alignment and north/east orientation, shared colors and appropriate scale.

For each phase, record new commands, environment, inputs, fingerprints, tolerances, results, screenshots and dated agent visual findings under `docs/evidence/view-context/`. Compare the implemented views to the reference at desktop and narrow sizes and at origin, arrival, intermediate and final states. Record blockers and pending work. Do not describe historical tests or screenshots as new Next.js passes, and do not claim human signoff from agent review.
