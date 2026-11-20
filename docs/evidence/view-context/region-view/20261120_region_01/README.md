# REGION VIEW acceptance - 2026-11-20

Status: **PASS / complete**. Reviewer: Codex agent, 2026-11-20 (Asia/Manila). This is executed automated verification and agent visual review, not human signoff. The approved implementation stops here: CITY PERSPECTIVE is ready; COMPARE feature work remains blocked by that phase.

## Changes and compatibility

`viewer/viewer.js` now distinguishes paused-at-origin, paused, playing and per-panel completion, including repainting after pause. Selecting a scenario clears a previously inspected hidden scenario and restores the original prompt. Visible selection continues to update through scrub/playback. Map fit has 7 km total padding rather than 5 km; projected north text sits above the arrow, and the centered 5 km label sits below its bar. Labels are constrained to the map viewport. `viewer/viewer.css` supplies label offsets. Blue-gray colors, installed fonts, north-up orthographic cameras and equal projected scale remain.

No scientific code, MATLAB entry point, exporter, template, vendored dependency, public API or payload field was changed. Schema 1, scalar scenario normalization, all existing `window.modsimViewer` controls/getters and `show('all')` remain compatible. Full batches default to comparison; independent exports select their sole scenario. Legacy video dispatch was untouched; no video re-render was required.

## Inputs, preservation and payload verification

Preserved copies were made from `results/runs/viewer_acceptance_20261120/{batch,independent_2_A,independent_3_B,independent_1_C}` into `results/runs/region_view_20261120_region_01/`. Only these working copies were exported. The original fixture directories were never exported or edited.

[Before hashes](scientific_before.json) and [after checks](preservation_checks.json) cover **129 scientific MAT/CSV files per tree**, 258 source/working files total. All bytes match the before snapshot. [Payload preservation](payload_preservation.json) checks all seven exported payloads against the existing originals and verifies every current presentation source fingerprint in their manifests. All scientific arrays, grid identities, geometry, masks, population, settings, onsets, PGV, final probabilities, separate losses, LGU totals, epicenters, overlays and original provenance match exactly.

The three old independent presentation JSONs still described the historical raised columns and [0,1] palette. Re-exporting uses the existing, unchanged exporter's current flat [0,0.1] encoding. **Only `encoding` differs** for those old independent artifacts; no field was added by this implementation. Batch payloads are identical in full. This is a superseded presentation description, not a scientific change.

MATLAB R2026b Update 1 (26.2.0.3433840) passed the extended `verify_viewer_payload` for batch A/B/C, comparison equality, and independent A/B/C. It additionally checks schema, CRS, cell size, scenario identity, epicenter, horizon and original provenance; numerical tolerance remains **1e-8**. See [MATLAB execution log](matlab_exports.log).

## Browser results

Installed Edge 157.0.4341.60, headless, offline browser context, Windows x64, AMD Ryzen 5 5600H, 12 logical CPUs. Installed `playwright-core` was reused; no dependency was added. Desktop viewport 1440x1100; narrow viewport 390x844.

Each tested HTML is the only file in its own `standalone/<case>/` directory, opened with `file://`; there is no sibling JSON. Results:

| Case | Passing checks | MATLAB reference maximum error | Playback fps | HTTP(S) requests | JS errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| [comparison](comparison/browser_checks.json) | 38 | 0 | 60.000 | 0 | 0 |
| [A](A/browser_checks.json) | 35 | 0 | 60.000 | 0 | 0 |
| [B](B/browser_checks.json) | 35 | 0 | 59.999 | 0 | 0 |
| [C](C/browser_checks.json) | 35 | 0 | 60.001 | 0 | 0 |

The 143 passing assertions cover saved MATLAB reference times, first-onset equality, half duration, intermediate, own/shared endpoints and backward restoration; rendered counters with rounding; all 17 fixed final LGU rows including Pateros; every sampled tile color; and complete boundary vertex sets reconstructed independently from saved cell centers and onsets (without trusting viewer edge lists). Boundary comparisons canonicalize endpoint order at 0.1 m precision to accommodate float32 rendering; scientific numeric comparisons retain 1e-8.

Real controls cover cell raycasting, all picked-cell values against saved arrays, live inspection through half duration/final/backward zero, scenario changes and clearing hidden inspection, play/pause status, restart, speed, scrub, linked pan/zoom, north-up reset, north/east projection with equal screen scale, resize, internal table scrolling and endpoint stop. A separate in-memory fixture sets two probabilities to 25% and 10%; their colors match while inspection retains 25.0000%. This fixture never writes a payload or scientific file. WebGL-disabled documents display a readable fallback. Request/error capture includes the fallback and fixture.

## Dated visual review

Reviewed 2026-11-20 by Codex agent using the saved screenshots and review sheets:

- **Desktop origin and arrival:** [origin](comparison/initial.png), [first onset](comparison/onset.png), [5 s arrival progression](comparison/partial.png). The full grid fits; north text clears the arrow; the 5 km label clears the scale bar. Inactive gray and awaiting gray-green remain distinct. At exact first onset, the arrived cell has zero displayed probability, so progression is intentionally subtle; the 5 s capture shows clear amber shared-edge boundaries and pale arrived cells. Pasig and Muntinlupa markers remain legible over the fault. The fault continues beyond the NCR viewport; those out-of-region line portions are naturally clipped, while the grid is fully framed.
- **Desktop intermediate and final:** [20 s](comparison/intermediate.png), [final](comparison/final.png), [phase review sheet](comparison/desktop-review.png). Maps align at equal scale; A is visibly lighter than B/C with the common legend. B/C differences remain proportional to saved values (maximum final probability difference 0.021353668936397452, about 2.14 percentage points). Separate death/injury counters and paused/complete labels fit. The fixed table shows all 17 rows and NCR totals without clipping.
- **Narrow origin, arrival, intermediate and final:** [phase review sheet](comparison/narrow-review.png), [full intermediate page](comparison/mobile_intermediate.png), plus `comparison/mobile_{origin,arrival,intermediate,final}.png`. Stacked maps stay north-up and fully framed. North/scale text, epicenters and fault remain readable. The timing/transfer disclaimer, legend, controls and inspected values wrap within the viewport. The comparison table is intentionally wider than the viewport and scrolls inside its container; the page has no horizontal overflow.
- **Independent A/B/C:** [desktop phases](independent-desktop.png), [narrow phases](independent-narrow.png), and each case directory's full screenshots. Each shows its sole scenario with correct location/duration. The desktop map is centered in the wider single-panel area; equal scaling preserves the tall NCR shape. Origin/first-arrival/intermediate/final states retain overlays and labels, with no empty comparison panels. [Independent C full narrow page](C/mobile_origin.png) includes the complete 17-row table and settings disclosure.
- **Fallback:** [WebGL unavailable](comparison/webgl-unavailable.png). The readable error directs the reader to hardware acceleration or the static PNG/CSV outputs; controls are disabled and the failed map is hidden.

No unresolved REGION VIEW blocker was found. Timing remains assumed, model transfers remain unvalidated, and these illustrative outputs are not earthquake forecasts. The optional city-focus workflow and new comparison features were not implemented or claimed as verified.

## Commands and execution notes

Run from the repository root. For a fresh run ID, this helper copies fixtures, hashes source/copy science, exports in MATLAB, verifies payloads and prepares isolated HTMLs:

```powershell
python tools/verify_region_view.py <fresh-run-id>
```

In this managed environment MATLAB initially failed inside the sandbox with `System Error: File system inconsistency`. Installed MATLAB and Edge were then run with approved sandbox escalation (Edge initially returned `spawn EPERM`). These are execution-environment issues, not acceptance passes. Early added verifier assertions incorrectly treated the CRS as text and the decoded epicenter as a row; both test assertions were corrected. The first browser pass caught the unapplied status-text replacement; it was fixed and all copies re-exported. An independent run exposed a test race reading the clock before repaint; the harness now waits for the rendered value. The final commands below passed. Earlier MATLAB failures remain visible before the `FINAL EXPORT` section in the log.

```powershell
& 'C:/Program Files/MATLAB/R2026b/bin/matlab.exe' -batch "addpath('src','tests'); root='results/runs/region_view_20261120_region_01'; names={'batch','independent_2_A','independent_3_B','independent_1_C'}; diary('docs/evidence/view-context/region-view/20261120_region_01/matlab_exports.log'); fprintf('FINAL EXPORT MATLAB %s\n',version); for k=1:numel(names), r=fullfile(root,names{k}); fprintf('CHECK %s\n',r); export_scenario_viewer(r); verify_viewer_payload(r); end; diary off;"
python tools/verify_region_view.py 20261120_region_01 --finalize
foreach ($caseId in @('comparison','A','B','C')) {
  $viewerStem = if ($caseId -eq 'comparison') { 'ABC_comparison' } else { $caseId }
  node tools/test_viewer.cjs 'C:/Users/yuanw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core' "results/runs/region_view_20261120_region_01/standalone/$caseId/${viewerStem}_viewer.html" "docs/evidence/view-context/region-view/20261120_region_01/$caseId" 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --check viewer/viewer.js
node --check tools/test_viewer.cjs
```

`--finalize` resumes preservation/fingerprint checks and refreshes isolated copies after MATLAB was executed separately; it does not run MATLAB. Each `*_browser.log` records the final browser command's results. `source_fingerprints.json` records final implementation, verification tools, approved plan, and isolated HTML hashes. Source presentation hashes also appear in `payload_preservation.json`. Screenshots and contact sheets are visual evidence only; numeric correctness comes from the executed checks.
