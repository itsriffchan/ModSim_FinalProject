# Phase 3: COMPARE

## Objective and sequencing

Complete and verify linked comparison of the actual saved A/B/C outputs after REGION VIEW and CITY PERSPECTIVE are complete. Status: **blocked by CITY PERSPECTIVE completion**. Follow [the shared workflow](README.md): each prerequisite's checks and recorded visual review must pass before this phase starts. Passing gates permits continuation without another approval step. Phase names do not prescribe navigation labels.

## Verified starting state

Source inspection of [viewer.js](../../viewer/viewer.js) confirms an existing `all` mode with three panels, shared time, linked north-up pan/zoom, separate animated NCR counters and fixed final LGU columns. [The exporter](../../export_scenario_viewer.m) creates individual viewers and `comparison/ABC_comparison_viewer.html` from a complete saved batch. With one saved scenario it exports only that scenario; a partial two-scenario batch is rejected. Comparison is therefore an existing foundation to finish and verify, not a reason to bypass earlier gates.

[Current heatmap verification](../VIEWER-VERIFICATION.md) records different saved B/C onset arrays and maximum absolute final probability difference `0.021353668936397452` (about 2.14 percentage points) in its two tested batches. This corrects an earlier plan assumption of identical B/C maps. It is historical evidence for those batches, not a constant to impose on future data. New implementation and browser checks remain pending.

## Required behavior

- Bind A to assumed Pasig/20 s, B to the same assumed Pasig epicenter/40 s, and C to assumed Muntinlupa/40 s. A/B is an **assumed duration sensitivity experiment**; B/C compares location at equal duration. A single historical event does not establish a causal duration law. Never substitute the legacy alternative 20 s case for C.
- Compare actual saved arrays and settings with the same mask, geometry, exposure, vulnerability and unrelated parameters. Report incompatible batches as blockers. Do not force equal maps or normalize each panel's colors independently.
- Retain the common 0–10% palette, true inspected values, north-up equal projected scaling, linked pan/zoom/reset and shared origin-elapsed timeline. Keep completed panels final through the maximum horizon and stop playback there. Distinguish different onset progression from differences in final probability.
- Present separate death/injury expectations and fixed final values for every LGU, including Pateros. If carrying city focus into comparison, synchronize by stable LGU code and preserve CITY PERSPECTIVE allocation semantics and final-summary labeling. Do not confuse focused cells with allocated totals.
- Show observed differences in proportion to the saved numbers. If adding numeric deltas, explicitly label direction (`B minus A`, `C minus B`), units and whether the values are current display state or final. Use percentage points for probability differences; do not mislabel them as percent change. No difference metric is required merely to make small map differences appear stronger.
- Keep independent exports useful: do not display empty comparison panels or require missing A/B/C data. Preserve offline operation, current style, assumed-timing disclaimer and scientific limitations.

## Implementation entry points and constraints

- [Viewer](../../viewer/viewer.js): `show`, `link`, `reset`, `setTime`, `state`, `update`, `table` and `render`; [template](../../viewer/template.html) and [styles](../../viewer/viewer.css) control comparison layout.
- [Exporter](../../export_scenario_viewer.m), [payload writer](../../src/write_scenario_viewer.m) and [payload verifier](../../tests/verify_viewer_payload.m) establish equality between combined and individual scenario payloads. [Scenario orchestration](../../src/orchestrate_scenarios.m) provides scientific comparison context; do not alter calculations for presentation.
- [Browser harness](../../tools/test_viewer.cjs) already exercises comparison timing, linked cameras and performance; extend it for any added city interactions or deltas. Preserve schema 1 and the full `window.modsimViewer` interface listed in [REGION VIEW](REGION-VIEW.md), including `show('all')`. No new scientific fields are needed; any optional presentation labels/delta metadata must be additive and tolerate older payloads. Do not implement fields during this documentation task.

## Acceptance checks

1. Run [shared MATLAB payload and preservation checks](README.md#verification-procedure-for-later-phases). Require combined scenario payloads to match individual exports exactly. Check A/B/C identity, duration and epicenter bindings; verify shared exposure, vulnerability, geometry and unrelated settings against saved state. Preserve MAT/CSV bytes and original provenance.
2. Measure actual saved A/B and B/C differences (onsets, final probabilities, separate losses and LGU totals), recording signed deltas and maximum absolute differences with units. Reconcile any displayed deltas to these values; do not assert B/C equality or require a historical difference value for a different batch.
3. Check each panel at zero, its own onset, intermediate time and final horizon against MATLAB references within 1e-8; check shared-clock behavior, backward restoration, early completion retention and stopping at the maximum endpoint. Check fixed final tables against all 17 saved LGU rows including Pateros.
4. Run offline browser checks for linked pan/zoom/reset, common palette, inspection, scenario switching, playback/speed/scrub, resize, no network/errors, WebGL fallback and recorded performance of at least 30 fps on the test machine. Test all individual exports as well as the combined viewer. Rerun REGION VIEW and CITY PERSPECTIVE regressions, including shared boundary cells and old payload compatibility.
5. Record desktop and narrow-layout screenshots of origin/onset/intermediate/final comparison, B/C differences and any linked city focus. Visually review aligned geographic scale, palette consistency, readable settings/legends/counters, unclipped panels and table scrolling. Numeric passes and historical screenshots do not replace this review.

## Handoff requirements

Follow [the shared handoff record](README.md#handoff-record-required-at-each-gate). Record compared batch identities, measured differences, commands, environment, compatibility and scientific preservation evidence, prior-phase regressions, screenshots and visual findings. Mark COMPARE complete only when its checks and recorded visual review pass. Leave failures and unexecuted checks explicitly pending with next actions; do not claim human signoff from automated execution or agent review.
