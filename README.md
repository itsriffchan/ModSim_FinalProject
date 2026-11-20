# Grid-Based Casualties Simulation Following The Big One

**CS0019 — Modeling & Simulation**  
Chan Reese, Ebrahim Fathi, Pacate Denienz, and Whitty Juan Angelo Roy

This MATLAB model estimates night-time indoor earthquake damage and casualties on a simplified NCR grid, including all 17 LGUs and Pateros. It combines PSA 2020 exposure, WorldPop allocation weights, a 67 km West Valley Fault rupture, BSSA14 median PGV, Yamaguchi RC-average damage probabilities, and Hazus casualty rates. Transfers and inventory crosswalks remain assumptions; outputs are model expectations, not earthquake forecasts.

| Primary ID | Assumed epicenter | Local shaking duration | Duration treatment |
|---|---|---:|---|
| A | Pasig baseline | 20 s | Reference |
| B | Pasig baseline | 40 s | ASSUMED alpha = 0.25 |
| C | Muntinlupa alternative | 40 s | ASSUMED alpha = 0.25 |

A/B isolates duration sensitivity. B/C compares location at equal duration. Near-identical B/C losses can follow from the overlapping 67 km ruptures. Former S3 at 20 s and point-source cases are retained in `legacy_scenarios`, excluded from primary runs and videos. The alternative 20 s requirement in [RESEARCH.md](docs/RESEARCH.md) is superseded.

## Run

From the repository root, in MATLAB:

```matlab
root = run_all();                          % unit tests, Kobe, A/B/C, comparison
[r, artifacts] = run_scenario('A');        % independent scenario
[r, root, checks] = run_scenarios();       % A/B/C without Kobe/unit tests
root = run_acceptance();                  % full export and isolation acceptance
```

Each runner accepts an optional output root; `run_scenario` takes it as the second argument. Omission creates `results/runs/<timestamp>_<unique>/`. A supplied destination must be empty. Existing raw inputs and committed results are preserved. No extra MATLAB toolboxes or external encoders are required. A working MATLAB installation with compatible graphics and video support is needed; current release/codec support has not been verified.

```text
<runRoot>/
  prepared/       grid tables/maps, arrivals, prepared.mat, checks.csv
  A/             cells.csv, lgu.csv, state.mat, animation_data.mat,
                 timeline.csv, checks.csv, p_heavy.png, final_frame.png,
                 frame_times.csv, video_export.json, A.mp4 (or A.avi)
  B/             corresponding B artifacts
  C/             corresponding C artifacts
  comparison/    summary/differences, LGU charts, comparison_state.mat,
                 checks.csv, frame_times.csv, final_frame.png,
                 ABC_comparison.mp4 (or AVI), video_export.json
  kobe/          full-workflow historical reference processing only
```

Independent runs create only `prepared/` and their selected scenario directory. States retain resolved settings, source references, SHA-256 input/code fingerprints, Git revision and dirty status, and actual MATLAB runtime metadata.

## Animation assumptions

Local S-wave arrivals use the existing simplified depth/speed model. For each active cell, progression is `clip((t - S_arrival)/duration, 0, 1)`. Displayed heavy probability and expected casualties reveal their final static arrays using that fraction. This is assumed timing, not a validated rupture or damage-evolution simulation. Simultaneous onset appears only as a labelled timing control in the numerical timeline.

Videos share probability limits [0,1], north-up equal-scale UTM 51N maps, fault/LGU overlays, masked inactive cells, scenario epicenters, and cumulative expected deaths/injuries. Defaults: 24 fps, quality 95, 2 simulated seconds per playback second, 2 playback seconds final hold; 1280×960 standalone and 1920×1080 comparison. The comparison uses one source-origin clock and retains completed panels. Numerical arrays are saved every 0.25 simulated seconds. MPEG-4 is probed first, then Motion JPEG AVI. Export failures preserve numerical state and produce failed checks.

## Verification status

**The new MATLAB workflow and four videos remain unverified.** MATLAB was not located on PATH, in the standard installation directory, or in the queried registry keys on this machine. Static syntax checks and independent Python characterization are distinct from MATLAB acceptance. See [implementation verification](docs/IMPLEMENTATION-VERIFICATION.md).

The preserved [historical ledger](results/all_checks.csv) contains **116 PASS, 0 FAIL, 1 SKIPPED**. These entries do not verify the refactor. Historical release descriptions disagree between R2026a and R2026b; actual runtime information will be saved on each new run.

Corrected historical S-series CSVs report:

| Historical case | Expected deaths | Expected nonfatal injuries |
|---|---:|---:|
| S1, equivalent scientific settings to A | 4,598.6 | 51,480.0 |
| S2, equivalent scientific settings to B | 7,094.8 | 78,981.8 |
| Former S3, alternative **20 s** | 4,598.6 | 51,479.6 |

These are preserved model outputs from [scenario_comparison.csv](results/scenarios/scenario_comparison.csv), not newly executed A/B/C results. C requires a new 40 s calculation.

Checks implement A/B stored regression, probability bounds, zero PGV, population/housing conservation, both casualty aggregation sums, local timing, terminal static agreement, presentation independence, measured repeat/reordered calculations, and per-frame video decoding. `run_acceptance` additionally compares public independent runs against the batch and hashes other sandbox artifacts. Visual review of saved first/onset/completion/final frames is required before delivery is accepted.

## Sources and limitations

Exposure totals are 13,484,462 residents and 3,257,020 occupied housing units. Housing units are not building counts. Distances use EPSG:32651 in km; PGV remains cm/s. The RC-average fragility is an unvalidated Japanese-to-Philippine transfer. Duration scaling `PGV_eff = PGV × (T/20)^alpha` is applied once before fragility. Casualties exclude fire, liquefaction, rescue, and delayed effects. Kobe census rates use the 1990-10-01 population, not the population present in January 1995.

See [data sources and redistribution](docs/data_sources.md), [assumptions](docs/ASSUMPTIONS.md), [grid method](docs/ncr_grid_method.md), [report](docs/REPORT.md), [demo and acceptance](docs/DEMO.md), and [input acquisition](tools/README.md). Raw observations remain separate from processed inputs and generated outputs.

## Delivery checklist

- [x] Historical input cleanup and baseline outputs are present in the repository.
- [ ] Execute the new unit, scientific regression, integration, and isolation checks in MATLAB.
- [ ] Export and decode A, B, C, and synchronized comparison videos successfully.
- [ ] Inspect first, onset, completion, and final frames for readability and overlays.
- [ ] Record actual MATLAB release, codec, check outcomes, and artifact locations.
