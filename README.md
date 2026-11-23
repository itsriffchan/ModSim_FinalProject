# Grid-Based Earthquake Damage and Casualty Simulation in NCR

**Course:** Modeling and Simulation (CS0019)  
**Members:** Reese Chan, Fathi Ebrahim, Denienz Pacate, and Juan Angelo Roy Whitty

## Overview

This MATLAB project models an assumed magnitude 7.2 earthquake along the West Valley Fault in a 500 m grid covering all 17 NCR local government units, including Pateros.

The project compares:

| Scenario | Epicenter | Local shaking duration |
|---|---|---:|
| A | Pasig | 20 seconds |
| B | Pasig | 40 seconds |
| C | Muntinlupa | 40 seconds |

Scenario A is the baseline. Scenario B is an assumed duration-sensitivity experiment. Scenario C compares epicenter location at equal duration.

The outputs are model expectations, not earthquake forecasts.

## Quick start

Open MATLAB, set the current folder to the repository root, and run:

```matlab
addpath(pwd, fullfile(pwd, 'src'), fullfile(pwd, 'tests'));
demo_scenario
```

Change `scenarioId` in `demo_scenario.m` to `'A'`, `'B'`, or `'C'`.

To run the complete workflow, including unit tests, Kobe processing, A/B/C scenarios, sensitivity studies, viewers, and verification ledgers:

```matlab
root = run_all();
```

For a complete A/B/C run without the Kobe and unit-test stages:

```matlab
[results, root, checks] = run_scenarios();
```

To run only one primary scenario:

```matlab
[result, artifacts] = run_scenario('A');
% Replace 'A' with 'B' or 'C'
```

To generate legacy MP4/AVI videos:

```matlab
root = run_all([], 'video');
```

Run results are written to `results/runs/<timestamp>_<unique>/` by default.

## Results

Presentation-ready figures are in [results/report_figures/](results/report_figures/):

- A/B/C totals
- Combined heavy-damage probability map
- Individual A, B, and C summary figures
- A/B/C totals CSV

The verified A/B/C batch also includes:

- Cell and LGU result tables
- Heavy-damage maps
- Shaking and casualty timelines
- Offline standalone viewers
- Optional MP4/AVI presentations

## Repository layout

```text
config/       Model configuration
data/         Raw and processed project inputs
src/          Reusable MATLAB functions
tests/        Numerical and presentation tests
tools/        Report and verification utilities
results/      Report figures and saved simulation runs
viewer/       Offline standalone HTML viewer
docs/         Scientific, presentation, and verification documentation
demo_scenario.m
run_all.m
run_scenario.m
run_scenarios.m
run_acceptance.m
```

## Main assumptions

- A median BSSA14 ground-motion relationship estimates PGV.
- Yamaguchi–Yamazaki RC-average fragility curves estimate heavy damage.
- Hazus casualty rates estimate separate deaths and nonfatal injuries.
- The project assumes nighttime residential occupancy.
- A 67 km rupture representation is used for all primary scenarios.
- The 40-second duration effect is assumed, not verified from the Kobe reference event.
- Fire, liquefaction, landslides, tsunami, rescue delays, and delayed deaths are excluded.

The Japanese fragility relationship and U.S. Hazus casualty relationships are unvalidated transfers for Philippine buildings and population assumptions.
