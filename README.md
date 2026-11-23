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

## Run the project

Open the repository in MATLAB and run:

```matlab
addpath(pwd, fullfile(pwd, 'src'), fullfile(pwd, 'tests'));
demo_scenario
```

Change `scenarioId` in `demo_scenario.m` to `'A'`, `'B'`, or `'C'`.

Other entry points:

```matlab
run_all()
run_scenarios()
run_scenario('C')
run_acceptance()
```

## Submission package

See [SUBMISSION.md](docs/SUBMISSION.md) for the recommended files to include.

Presentation-ready results are in [results/report_figures/](results/report_figures/):

- A/B/C totals
- Combined heavy-damage probability map
- Individual A, B, and C summary figures
- A/B/C totals CSV

The verified comparison batch and exported videos are under `results/runs/`; independent duplicate runs and intermediate review frames may be excluded from submission.

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
