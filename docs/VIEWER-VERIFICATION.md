# North-up probability heatmap verification — 2026-11-20

The approved heatmap update replaces the tilted columns with flat, unlit, contiguous tiles. The layout, scientific engine, saved probabilities, arrivals, casualties, original provenance, schema version 1 and browser inspection interface remain intact. The legacy video renderer was unchanged.

## Current behavior

All scenarios and times use a sequential light-to-dark blue 0–10% probability scale with ticks at 0%, 2%, 4%, 6%, 8% and 10%. Future values ≥10% use the darkest color while inspection retains their numerical values. Awaiting cells are gray-green, inactive cells are gray, and the amber assumed arrival boundary consists only of shared active-cell edges separating arrived and awaiting cells. Arrival is determined from saved onset times, including equality at onset. This is an assumed timing visualization, not a validated rupture or damage front.

Displayed probability remains `final_probability × clip((time − onset)/duration, 0, 1)`. The viewer labels it “Assumed progression toward final heavy-damage probability.” Current and final cell probabilities appear as percentages. North remains up during linked pan/zoom; orthographic fitting gives equal projected geographic scaling. Fault, epicenter, LGU outlines, north arrow and 5 km bar remain visible.

## Executed verification

MATLAB R2026b exported both saved batches below without scientific recalculation and passed `verify_viewer_payload` for A/B/C and comparison in each. All grid identities, masking, geometry, population, onsets, settings, PGV, final probabilities, losses, overlays, reference samples and 17 LGUs including Pateros matched saved state.

- `results/runs/video_export_fix_20261120/acceptance/batch/`
- `results/runs/viewer_acceptance_20261120/batch/`

Eight presentation manifests match the current presentation source fingerprints. All MAT/CSV files in these saved batches retained their pre-export SHA-256 hashes; the exact count is recorded in [preservation checks](evidence/heatmap/preservation_checks.json).

The [offline Edge browser run](evidence/heatmap/browser_checks.json) passed 26 checks, with maximum MATLAB reference discrepancy **0** (tolerance 1e-8), approximately **60 fps**, zero HTTP(S) requests and zero JavaScript errors. Checks covered origin, first arrival, partial spread, intermediate and final states; per-cell colors on the common scale; exact saved-onset boundary edge counts; backward restoration of colors, edges and counts; scenario selection; linked pan/zoom; north-up reset/projection; raycast selection; current/final percentage inspection; playback, speed and endpoint; responsive layout; and WebGL failure fallback. JavaScript syntax checks passed.

Agent screenshot inspection covered desktop comparison, individual A/B/C phases and mobile. The [partial spread](evidence/heatmap/partial.png), [final comparison](evidence/heatmap/final.png), [individual A](evidence/heatmap/A_final.png) and [mobile](evidence/heatmap/mobile.png) show readable fills and overlays, intact masking and no map or page clipping. The LGU table scrolls within its container on mobile. Mobile capture waits for the resized canvas and two animation frames; an earlier capture before repaint was discarded. This is automated execution and agent review, not human signoff.

## Plan assumption corrected against saved evidence

The plan described B/C final maps as identical. The actual saved arrays in both existing batches differ by up to **0.021353668936397452 probability** (about 2.14 percentage points), and have different onset arrays. They were preserved unchanged; no equality was imposed. The browser test records this measured difference and checks distinct arrival progression. Every displayed cell is independently checked against the same color function across A/B/C and time.

Original pre-heatmap evidence is retained under `docs/evidence/viewer/`; [the earlier verification record](evidence/heatmap/prior-viewer-verification.md) is historical and its oblique-camera and full-range encoding descriptions are superseded here. Full current phase screenshots are under `results/runs/heatmap_review_20261120/`. Scientific transfer and timing limitations remain unchanged.

To repeat: run `export_scenario_viewer(runRoot)` and `verify_viewer_payload(runRoot)` in MATLAB, then invoke `tools/test_viewer.cjs` as documented in [viewer/README.md](../viewer/README.md).
