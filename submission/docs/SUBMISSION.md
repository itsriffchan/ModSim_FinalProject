# Project Guide

## MATLAB workflow

Open MATLAB in this folder and run:

```matlab
addpath(pwd, fullfile(pwd, 'src'), fullfile(pwd, 'tests'));
demo_scenario
```

Set `scenarioId` in `demo_scenario.m` to `'A'`, `'B'`, or `'C'`.

For the complete workflow:

```matlab
root = run_all();
```

`run_all` performs unit checks, Kobe processing, NCR grid preparation, A/B/C scenarios, sensitivity studies, and verification. It creates a timestamped output directory under `results/runs/`.

For A/B/C only:

```matlab
[results, root, checks] = run_scenarios();
```

For one scenario:

```matlab
[result, artifacts] = run_scenario('A');
```

Replace `'A'` with `'B'` or `'C'`.

For legacy MP4/AVI output:

```matlab
root = run_all([], 'video');
```

## Presentation assets

The `presentation/` folder contains:

- A/B/C totals chart
- Combined heavy-damage probability map
- Individual A, B, and C summary maps
- Standalone A, B, C, and comparison viewers
- Synchronized MP4 animations

Open an HTML viewer directly in a WebGL-capable browser. MP4 files can be embedded in the presentation as a fallback if WebGL is unavailable.
