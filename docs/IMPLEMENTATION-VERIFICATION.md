# A/B/C implementation verification — 2026-11-20

Current presentation update: default runs now produce offline interactive north-up probability heatmaps. See [VIEWER-VERIFICATION.md](VIEWER-VERIFICATION.md) for the fresh MATLAB acceptance, scientific preservation, offline browser tests, performance and agent visual review. Prior video evidence and human-review status below are preserved.

Subsequent update: the [focused video export fix verification](VIDEO-EXPORT-VERIFICATION.md)
records successful MATLAB, export, sensitivity and isolation checks. The text
below preserves the earlier review; its unexecuted-runtime statements are
superseded by that record. Human visual acceptance is still pending.

The implementation is **pending MATLAB and video acceptance**. No new MATLAB run, codec success, or delivered video is claimed. Raw inputs, historical results, and `docs/RESEARCH.md` were preserved.

Executed checks:

| Check | Observed result | Scope |
|---|---|---|
| MISS_HIT Core 0.9.44, `mh_style --no-style --brief .` | 51 MATLAB files parsed successfully | Syntax only; no MATLAB execution |
| `python tools/verify_scenario_contract.py` | PASS, including 11 sensitivity cases and internal alternative control | Independent standard-library characterization from committed prepared CSVs |
| A cell regression in Python | Maximum absolute discrepancy 1.0232e-12 | PGV, distance, heavy/moderate probabilities, heavy units, deaths, injuries against stored S1 |
| B cell regression in Python | Maximum absolute discrepancy 1.2506e-12 | Same fields against stored S2 |
| Exposure characterization | 13,484,462 residents; 3,257,020 occupied housing units; 17 LGUs, Pateros included | Committed prepared data |
| Derived horizons | A 29 s; B 49 s; C/comparison 53 s | Stored local S arrivals plus configured duration, rounded up |
| `matlab -batch "run_all"` | Could not start: command not recognized | MATLAB unavailable on PATH; standard directory/registry searches also found no installation |

Python characterization yields A: 4,598.591965 deaths / 51,479.999620 injuries; B: 7,094.767892 / 78,981.811074; C: 7,094.710184 / 78,981.184292. These characterize the intended formulas on **stored prepared geometry**, not executed MATLAB refactor outputs. Actual C minus B is −1.049606 heavily damaged housing units, −0.057708 deaths and −0.626782 injuries. The overlapping finite ruptures provide little separation in final losses. No check imposes a target magnitude or sign for that difference. No scientific relationship or primary parameter was changed.

The restored numerical sensitivity runner uses copied configurations and resolved scenarios with `calculate_scenario`; it produces no videos. Duration studies cover B and C at alpha `{0, 0.15, 0.25, 0.40}` with Vs30 fixed at 360 m/s. Site studies cover A at `{250, 360, 760}` m/s. The separate alternative 20 s control is internal, never primary. Cases save cell/LGU tables, resolved settings, provenance, runtime metadata and numerical ledgers under `<runRoot>/sensitivity/`; the two study summaries and control summary contain parameter values, damaged housing units, deaths and injuries.

The expanded Python characterization passed both alpha-zero same-location controls, alpha 0.25 matches to B/C, Vs30 360 match to A, all configured experiments, probability/loss bounds, housing/population conservation, LGU aggregation and Pateros, reversed/repeated calculations and primary preservation. For example, A at Vs30 250 gives 5,426.101172 expected deaths / 60,640.321409 injuries; A at 760 gives 1,183.783714 / 13,470.239240. No casualty monotonicity requirement was imposed across sweeps. Python does not verify MATLAB execution, regenerated geometry, MAT/CSV serialization, file isolation, graphics, codec availability or label readability. The implemented MATLAB checks for those requirements remain unexecuted.

The preserved `results/all_checks.csv` has 116 PASS and 1 SKIPPED. Its SHA-256 is `b8d238cb2ea035357b16e3a8088cd744dc8d1878ec78deb4649718ee56da58b2`. It is historical evidence, not acceptance of these changes. Earlier report injury tables were refreshed from the corrected committed CSVs.

## Remaining acceptance

Run `root = run_acceptance()` from the repository root on an available MATLAB installation, with a fresh destination. This runs the full unit/Kobe/primary/sensitivity workflow, then compares independent C/A/B/A sandboxes with the batch and verifies byte preservation of the batch, with explicit checks for sensitivity artifacts. Scenario ledgers include A/B reference regression only for matching primary settings, conservation, zero-input behavior, timing, and terminal agreement. Sensitivity ledgers include coverage, numerical engine checks, controls, primary matches, reversed/repeated execution and preservation of primary settings/results. Comparison checks measure repeated/reordered engine calculations and presentation independence. Failed video checks are failures, not successful delivery.

Acceptance requires successful `batch/all_checks.csv`, all scenario/comparison/experiment ledgers, `batch/sensitivity/checks.csv`, and `acceptance_checks.csv`; actual MATLAB/runtime metadata and input/code fingerprints; and all four production videos encoded and fully decoded. Record the actual codec from each `video_export.json`. Inspect each saved first/onset/completion/final frame and corresponding encoded video frame for readable, unclipped labels, correct overlays, inactive masks, scenario identity and the adjacent “ASSUMED timing: reveal of final expected totals” counter label. For the comparison, review each panel's onset/completion. The renderer numerically checks completion and decodes all frames for dimensions/count and held-frame stability; that cannot establish visual readability. Review manifests to confirm shared comparison timestamps and final hold.

`run_acceptance` creates `visual_review.csv` with 16 PENDING entries. A human must record PASS for each video/phase, reviewer, UTC review date, evidence path/frame numbers and notes after inspection. Automated checks passing only establishes automated evidence; delivery and the README checklist remain incomplete until that review is recorded. Runtime/video checks and human inspection are pending on this machine.

Numerical state is saved before export. If both codec profiles fail, inspect the scenario `video_export.json`; preserve the existing sandbox and rerun in a fresh destination after correcting the runtime. Do not count unavailable MATLAB/video checks as passes. See [DEMO.md](DEMO.md) for commands and artifact locations.
