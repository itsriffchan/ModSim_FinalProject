# Demo: running the model

## Requirements

- MATLAB R2020a or later (developed against R2026a). Only **base MATLAB** is required: `readtable`, `polyshape`, `inpolygon`, `erfc`, `exportgraphics`. The Mapping Toolbox is not used.
- The processed CSVs already in `data/processed/` (committed). You do **not** need the raw 360 MB COD-AB FileGDB, the WorldPop GeoTIFF, or the GEM geojson to run the model.
- Optional, to rebuild those CSVs: Python 3 with the packages in `tools/requirements-prep.txt`. See `tools/README.md`.

## Run everything

From the repository root, in a terminal (PowerShell on Windows is fine):

```text
matlab -batch "run_all"
```

Or, if `matlab` is not on `PATH`:

```text
"C:\Program Files\MATLAB\R2026a\bin\matlab.exe" -batch "run_all"
```

`run_all` will:

1. Print the MATLAB version and the installed product list (`ver`).
2. Run unit tests (UTM, a synthetic 3×3 grid, Yamaguchi fragility, BSSA14 PGV).
3. Run steps 5–8 (Kobe tables, join, descriptive rates, chart).
4. Run steps 9–10 (rebuild the NCR 500 m grid, allocate population and housing, distance maps).
5. Run steps 11–15 (BSSA14, Yamaguchi damage, Hazus casualties, official S1/S2/S3 plus illustrative point-source S1p/S3p, sensitivity, charts).
6. Write `results/all_checks.csv` and exit with an error if any required check **FAIL**s. `SKIPPED` (for example the Mapping Toolbox cross-check) is not a failure.

The first grid build takes a few minutes (polygon intersects for 50×97 cells). Subsequent scenario math is shorter. Figures are written with the display off, so a headless session is enough.

## What to look at in a live demo

1. `results/kobe/kobe_ward_rates.png` — nine-ward death and injury rates per 1,000 **1990-census** residents. Say out loud that these are not NCR coefficients.
2. `results/ncr_grid/ncr_base_map.png` — 17 LGUs including Pateros, GEM West Valley Fault, two assumed epicenters, fault-crossed cells.
3. `results/ncr_grid/ncr_population_2020.png` — PSA 2020 totals, WorldPop-weighted.
4. `results/scenarios/scenario_comparison.csv` — headline deaths and injuries for each scenario.
5. `results/scenarios/lgu_casualties_S1_S2_S3.png` — LGU bars, Pateros included.
6. `results/scenarios/S1_baseline_20s_p_heavy.png` versus `S3_alt_67km_20s_p_heavy.png` — official S3 is expected to look almost like S1, because a 67 km rupture covers all of the NCR fault in both positions. That is a finding.
7. `results/scenarios/lgu_deaths_pointsource_illustration.png` — the labelled **illustrative** point-source comparison, where a southward epicenter shift is visible.
8. `results/scenarios/mmeirs_model08_benchmark.csv` and the report’s comparison paragraph — rates against a 2000-population study, **not** a validation.

## Re-running a piece

```text
matlab -batch "addpath('src'); addpath('tests'); run_unit_tests(load_modsim_config(pwd), init_checks())"
```

`starter.m` and `inspect_jma_kobe.m` are unchanged from earlier branches. The JMA file is optional and gitignored; its absence does not fail `run_all`.
