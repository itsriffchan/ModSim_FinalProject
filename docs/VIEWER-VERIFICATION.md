# Interactive viewer verification — 2026-11-20

The approved [viewer brief](VIEWER-BRIEF.md) is implemented. Default runners create local HTML viewers and static maps; explicit `video` retains the legacy renderer. The scientific engine, input data and historical scientific outputs were preserved.

## Executed checks

Runtime: MATLAB **26.2.0.3433840 (R2026b) Update 1**, PCWIN64. Browser: installed Microsoft Edge **157.0.4341.60**, headless, Windows, 1440×1100 CSS viewport, 12 reported logical processors. No browser/package installation or paid service was used. Browser measurement is specific to this machine and headless setup, rather than a cross-device performance guarantee.

| Evidence | Observed result |
| --- | --- |
| Fresh `run_acceptance` default workflow | **759 batch PASS, 507 sensitivity PASS, 32 acceptance PASS**, zero failures/skips |
| Independent C/A/B/A public runs | Scientific arrays/settings equal the batch; other batch and sensitivity artifact bytes unchanged |
| A/B/C against prior MATLAB run | Cell and LGU scientific tables exactly equal |
| Default artifacts | Four viewers, numerical outputs and static maps; no MP4 or AVI anywhere in the new acceptance tree |
| Saved-run export | Complete batch and independent C exported without recalculation; saved MAT/CSV file hashes unchanged |
| Payload/state comparison | All grid IDs, geometry, masks, population, active IDs, arrivals, settings, PGV, heavy probabilities, separate losses, overlays and 17 LGU totals match saved MATLAB state |
| Browser/MATLAB reference samples | Zero, local arrival, half duration and completion: maximum measured discrepancy **0**, required tolerance 1e-8 |
| Comparison browser checks | **19 PASS** including scenario switches, backward scrub, restart, linked orbit/zoom, north-up reset/projection, raycast selection, resize, retained completed panels, endpoint stop, offline opening and WebGL fallback |
| Independent C browser checks | **18 PASS**, including the speed selector advancing the clock at the selected rate |
| Comparison playback | **60.00 fps**, 362 measured frames over 6033.4 ms; exceeds the 30 fps target |
| Independent C playback | **60.00 fps**, 424 frames over 7066.6 ms |
| Offline requests/errors | Only the local HTML navigation; **zero HTTP(S) requests and zero JavaScript errors** with browser context offline |
| JavaScript syntax | `node --check` passes for viewer, adapted controls and browser test |

The fresh default acceptance tree is `results/runs/viewer_acceptance_20261120/`. The first preview also successfully exported the older saved batch `results/runs/video_export_fix_20261120/acceptance/batch/`. Export adds/replaces presentation HTML/JSON only; earlier MAT, CSV and MP4 artifacts are preserved.

Explicit `run_scenario('A', freshRoot, 'video')` also passed: **MPEG-4, 1280 x 960, 24 fps, all 397 frames decoded**, including 48 stable final-hold frames. Its 56 scenario checks and 27 prepared-grid checks passed, with no codec errors; scientific tables exactly match the earlier A run. Evidence: `results/runs/viewer_legacy_video_A_20261120/A/video_export.json` and `docs/evidence/viewer/matlab_summary.json`. The legacy renderer was left unchanged; this supplemental run exercised the public explicit-video dispatch for A rather than repeating all four earlier video exports.

A final hash comparison also confirms **212 original raw-input/earlier-result files unchanged** against the preserved preexisting control manifest. All four refreshed presentation manifests match the final presentation source hashes.

## Review evidence

Recorded agent review inspected the comparison at origin, first onset (approximately 3.57 s), intermediate time (20 s), and shared completion (53 s); individual scenario screenshots; desktop/mobile layouts; and cell details. Labels and controls are readable, inactive cells gray, the correct assumed epicenters visible, LGU/fault overlays aligned, and all panels use the same probability limits. The fixed LGU table includes Pateros and stays separate from animated NCR counters. On mobile the final table scrolls horizontally within its own container.

During review an initial OrbitControls up-axis ordering error was found and corrected before the final tests. The regression now asserts that increasing northing projects upward and increasing easting projects right after reset. Both coordinate axes use the same projected km scale. The 5 km bars are drawn in map coordinates, so zoom/orbit affects them with the grid.

The model's heavy probabilities are approximately 0.0016–0.054 in A and 0.0031–0.080 in B/C. Most cells therefore use the lower end of the full [0,1] ramp, and heights are intentionally modest. The display does not rescale each scenario to exaggerate differences. LGU/fault lines and epicenter rings are cartographic overlays drawn above occlusion; they refer to cell footprints, rather than raised-cell roof surfaces. The north-up reset is an oblique orthographic view; orbiting changes its orientation.

The separate `visual_review.csv` generated by `run_acceptance` remains a blank template for an optional human review. The evidence here is agent inspection and automated browser execution, not a claimed human signoff. Previous MP4 visual limitations and their pending human signoff remain documented in [VIDEO-EXPORT-VERIFICATION.md](VIDEO-EXPORT-VERIFICATION.md).

Durable review artifacts are under [evidence/viewer](evidence/viewer/): browser check JSON, comparison screenshots and a review ledger. Full per-scenario phase captures, mobile and fallback screenshots remain under `results/runs/viewer_review_20261120/` and `results/runs/viewer_review_C_20261120/`. Logs: `results/runs/viewer_acceptance.log`, `viewer_saved_export.log`, and `viewer_integration.log`.

## Reproduce

```matlab
root = run_acceptance();
addpath('src','tests');
verify_viewer_payload(fullfile(root,'batch'));
files = export_scenario_viewer(fullfile(root,'batch'));
```

Run `tools/test_viewer.cjs` with an existing Playwright Core package and browser executable as documented in [viewer/README.md](../viewer/README.md). The browser test installs nothing. For scientific regression, byte preservation, saved export and explicit video dispatch together:

```matlab
addpath('tools');
verify_viewer_integration(acceptanceRoot, priorBatchRoot, freshVideoRunRoot);
```

Manifests distinguish payload verification from browser review and retain exact dependency and presentation source hashes. The payload's scientific provenance belongs to its original run; exporting a new presentation does not rewrite that historical provenance. The timing and model-transfer limitations remain visible in the viewer and are not changed by these checks.
