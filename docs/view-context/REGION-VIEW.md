# Phase 1: REGION VIEW

Status: **Next.js implementation complete** — evidence [nextjs/20261120_nextjs_01](../evidence/view-context/nextjs/20261120_nextjs_01/README.md) (2026-11-20 agent checks). Standalone evidence remains historical baseline. The [standalone region evidence](../evidence/view-context/region-view/20261120_region_01/README.md) remains a verified baseline. Follow [the shared handoff](README.md), then continue to City perspectives after this phase passes.

## Target

Build the Region view shown in the [reference image](design-reference.png): a blue-gray app header and Region/City perspectives/Compare navigation, A/B/C scenario selector, dominant regional map, map camera controls, a region summary with expected deaths and injuries, a final LGU totals action, probability legend and overlay key, and a playback bar with time, restart and speed. Make controls functional and responsive. Clearly display scenario, assumed epicenter, duration, timing and model limitations. Full batches may retain the existing comparison default; a single-scenario input opens its available scenario.

The reference includes a terrain-and-buildings context, geographic labels, West Valley Fault and epicenter. Create a spatially registered presentation using the saved grid and overlays. Any background terrain or buildings must be labeled illustrative unless supported by documented geographic data; building height must not encode damage. Provide a north-up geographic view with equal projected scale, bird's-eye and oblique controls and north reset as depicted. Keep the grid, fault, epicenter and scale legible; document camera and asset limitations instead of presenting invented locations as authoritative.

## Functional and scientific requirements

- Retain the saved active/inactive mask, LGU outlines, projected geometry and 0-10% shared probability scale; inspected probabilities retain true values above 10%. Show awaiting versus arrived zero and shared arrived/awaiting active-cell edges.
- Start paused at origin. Display state follows `final_probability * clip((time - onset) / duration, 0, 1)` using saved onsets; arrival includes equality. Animate separate NCR death/injury expectations from saved loss columns; keep the final LGU table fixed. Play, pause, restart, speed, scrub and endpoint handling must work.
- Support real cell picking with current/final probability, population, PGV and final separate losses. Preserve selection while its scenario is visible; clear it when switching away. Provide the settings and provenance.
- Support standalone A, B or C data as well as a complete batch; do not invent missing scenarios. Preserve the existing standalone HTML exporter and its public interface and legacy video behavior as described in the shared handoff.

## Acceptance

Verify payload and scientific preservation against saved state, all 17 final LGU rows and Pateros, display counters and inspected values with rounding and 1e-8 underlying tolerance, onset equality, half duration, intermediate, final and backward restoration. Independently reconstruct shared-edge boundaries from saved grid and onsets. Exercise scenario navigation, real picking, live inspection, playback controls, camera modes, reset, resize, fallback and applicable standalone regressions. Verify projected north-up geometry and overlay alignment; explicitly assess perspective views separately. Review desktop and narrow screenshots against the reference and record findings and any missing asset or offline limitations. Mark this phase complete only with fresh Next.js evidence.
