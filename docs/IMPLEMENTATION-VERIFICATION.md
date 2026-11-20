# A/B/C implementation verification — 2026-11-20

The implementation is **pending MATLAB and video acceptance**. No new MATLAB run, codec success, or delivered video is claimed. Raw inputs, historical results, and `docs/RESEARCH.md` were preserved.

Executed checks:

| Check | Observed result | Scope |
|---|---|---|
| MISS_HIT Core 0.9.44, `mh_style --no-style --brief .` | 49 MATLAB files parsed successfully | Syntax only; no MATLAB execution |
| `python tools/verify_scenario_contract.py` | PASS | Independent standard-library characterization from committed prepared CSVs |
| A cell regression in Python | Maximum absolute discrepancy 1.0232e-12 | PGV, distance, heavy/moderate probabilities, heavy units, deaths, injuries against stored S1 |
| B cell regression in Python | Maximum absolute discrepancy 1.2506e-12 | Same fields against stored S2 |
| Exposure characterization | 13,484,462 residents; 3,257,020 occupied housing units; 17 LGUs, Pateros included | Committed prepared data |
| Derived horizons | A 29 s; B 49 s; C/comparison 53 s | Stored local S arrivals plus configured duration, rounded up |
| `matlab -batch "run_all"` | Could not start: command not recognized | MATLAB unavailable on PATH; standard directory/registry searches also found no installation |

Python characterization yields A: 4,598.591965 deaths / 51,479.999620 injuries; B: 7,094.767892 / 78,981.811074; C: 7,094.710184 / 78,981.184292. These characterize the intended formulas on **stored prepared geometry**, not executed MATLAB refactor outputs. C's tiny difference from B is compatible with the finite-rupture geometry. No new local scientific relationship was introduced.

The preserved `results/all_checks.csv` has 116 PASS and 1 SKIPPED. Its SHA-256 is `b8d238cb2ea035357b16e3a8088cd744dc8d1878ec78deb4649718ee56da58b2`. It is historical evidence, not acceptance of these changes. Earlier report injury tables were refreshed from the corrected committed CSVs.

## Remaining acceptance

Run `root = run_acceptance()` from the repository root on an available MATLAB installation. This runs the full unit/Kobe/scenario workflow, then compares independent C/A/B/A sandboxes with the batch and verifies byte preservation of the batch. Scenario ledgers include A/B reference regression, conservation, zero-input behavior, timing, and terminal agreement. Comparison checks measure repeated/reordered engine calculations and presentation independence. Failed video checks are failures, not successful delivery.

All four production videos must encode and decode successfully. Record actual MATLAB version and codec from saved metadata. Inspect each saved first/onset/completion/final frame for readable, unclipped labels, correct overlays, inactive masks, and scenario identity. The renderer numerically checks completion and decodes all frames for dimensions/count and held-frame stability; that cannot establish visual readability. Review manifests to confirm shared comparison timestamps and final hold.

Numerical state is saved before export. If both codec profiles fail, inspect the scenario `video_export.json`; preserve the existing sandbox and rerun in a fresh destination after correcting the runtime. Do not count unavailable MATLAB/video checks as passes. See [DEMO.md](DEMO.md) for commands and artifact locations.
