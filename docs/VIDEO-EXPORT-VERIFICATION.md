# Video export fix verification — 2026-11-20

The renderer now reshapes the selected pixel dimensions to `[width height]`
before constructing figure and paper properties. It rejects settings that do
not contain exactly two finite, real, positive integers with
`modsim:InvalidVideoPixels`. Existing `errors` messages remain available;
`exceptions` adds the operation, codec, exception identifier, message and MATLAB
stack. Invalid dimensions are reported as `[]` so the diagnostic can also be
saved as JSON when the rejected input is complex or nonnumeric.

No configuration, scientific calculation, frame schedule, codec preference or
fallback, or human-review requirement was changed.

## Execution and evidence

MATLAB used: **26.2.0.3433840 (R2026b) Update 1**, Windows. The executable is
`C:/Program Files/MATLAB/R2026b/bin/matlab.exe`; it is not on PATH. MATLAB failed
at startup inside the filesystem sandbox, then ran successfully outside it.
No Windows display or accessibility settings were changed.

Evidence root, relative to the repository:
`results/runs/video_export_fix_20261120/` (ignored generated artifacts).

- `pixel_checks_final/checks.csv`: **26 PASS, 0 FAIL, 0 SKIPPED**. The test
  captures actual figure/paper properties at both configured resolutions, for
  row and column inputs, and rejects ten malformed inputs for each setting.
  Its failed export reports are intentional injected failures used to check
  diagnostics; they are not production export results.
- `acceptance.log`: full MATLAB transcript.
- `acceptance/`: fresh `run_acceptance` output, completed with exit code 0.
  `acceptance_checks.csv` has **32 PASS, 0 FAIL, 0 SKIPPED**, including C/A/B/A
  scientific isolation, batch/sensitivity artifact preservation, and nonempty
  destination rejection.
- `preserved_before.csv`: SHA-256 baseline for 212 raw-input and earlier-result
  files, excluding this new evidence directory.
- `preserved_after.csv`: **212 checked, 0 changed** against that baseline.
- `verify_evidence.m`: supplemental checks for exact frame counts, dimensions,
  final holds, review frames, all ledgers, and scientific equality with the
  prior batch at
  `results/runs/20261120T184334_tp87c9652f_e6d3_4ffb_ae3f_2562c6636144/batch/`.
- `supplemental_checks.csv`: **17 PASS, 0 FAIL, 0 SKIPPED**, MATLAB exit code 0.
  `ledger_summary.csv` lists every acceptance/scenario/sensitivity/focused-test
  ledger; all pass with no skipped checks.

All four production reports have `status = exported_and_decoded`, MPEG-4,
24 fps, quality 95, playback speed 2 and 48 final-hold frames. The renderer
checked every decoded frame's dimensions and held-frame stability. Each report
has empty `errors` and `exceptions` lists; no codec fallback was needed.

| Video | Dimensions | Encoded frames | Decoded frames |
|---|---:|---:|---:|
| A | 1280×960 | 397 | 397 |
| B | 1280×960 | 637 | 637 |
| C | 1280×960 | 685 | 685 |
| ABC comparison | 1920×1080 | 685 | 685 |

The batch ledger has **759 PASS, 0 FAIL, 0 SKIPPED**, replacing the prior
**755 PASS, 4 FAIL**. The sensitivity ledger has **507 PASS, 0 FAIL, 0 SKIPPED**.
All A/B/C cell and LGU CSVs are byte-for-byte identical to the prior batch.
MATLAB `isequaln` also confirms exact equality of each scenario's saved
configuration, resolved scenario, scientific cell arrays, LGU tables and totals.
All four independent runs also exported and fully decoded successfully.

## Reproduction

From the repository root in MATLAB, use new, empty destinations:

```matlab
addpath('src','tests');
cfg = load_modsim_config(pwd);
test_video_pixel_dimensions(cfg, fullfile(pwd,'results','runs','pixel_check_new'));
root = run_acceptance(fullfile(pwd,'results','runs','acceptance_new'));
```

MPEG-4 remains preferred; Motion JPEG AVI remains the fallback.
The renderer probes each attempted codec and decodes every production frame,
checking dimensions, count and final-hold stability.

## Visual acceptance

**Human approval remains pending.** A person must watch all four actual videos
and inspect first, onset, completion and final frames, including each comparison
panel's timing. Record status, reviewer, UTC review time, evidence paths and
findings in `acceptance/visual_review.csv`. Check north-up orientation, inactive
cells, consistent probability colors, fault/epicenter overlays, readable labels,
casualty totals, clipping and playback.

Agent inspection of the A/B/C `final_frame.png` files found overlapping
heading/scenario text and a clipped top scenario line. No corresponding overlap
was observed in the saved comparison final frame. Evidence paths and observation
times are in `visual_observations.csv`. These are static source-image
observations, not human approval; the focused dimension fix does not change layout.
Delivery remains incomplete until visual issues are resolved and a person
records approval. Automated export success alone cannot satisfy that gate.
