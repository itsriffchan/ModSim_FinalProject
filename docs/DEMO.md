# Running and reviewing the A/B/C simulations

MATLAB with base graphics, `VideoWriter`, and `VideoReader` is required. No extra toolboxes or external encoders are introduced. Current runtime and codec availability are unverified; historical R2026a/R2026b mentions do not establish support on this machine.

From the repository root:

```matlab
root = run_all();
% or a new, empty destination:
root = run_all(fullfile(pwd,'results','runs','review_ABC'));
```

To run one case independently:

```matlab
[result, artifacts] = run_scenario('C');
disp(artifacts.directory)
```

A = Pasig 20 s; B = Pasig 40 s; C = Muntinlupa 40 s. B/C share ASSUMED alpha = 0.25. A/B isolates duration and B/C isolates location. Former S3 at 20 s and illustrative point sources are legacy configurations. The alternative 20 s requirement in `RESEARCH.md` is historical.

`run_all` and `run_scenarios` also run numerical sensitivity studies with the same `calculate_scenario` engine. Duration cases use B and C at alpha `{0, 0.15, 0.25, 0.40}`, with Vs30 fixed at 360 m/s. Site cases use A at Vs30 `{250, 360, 760}` m/s. Each experiment changes one parameter; no additional videos are generated. `run_scenario` retains its independent behavior and creates no sensitivity outputs.

The batch adds these artifacts:

```text
<runRoot>/sensitivity/
  duration_alpha_sensitivity.csv   eight B/C cases
  vs30_sensitivity_A.csv           three A cases
  internal_controls.csv           alternative 20 s control, not primary
  checks.csv                      combined numerical/coverage/repeatability ledger
  duration_B_alpha_0/              one directory per experiment, with:
    cells.csv, lgu.csv, checks.csv, state.mat
  ...                             remaining duration and site experiments
  control_C_20s/                  same artifacts for the internal control
```

Summary rows contain identity, role, epicenter, duration, alpha, Vs30, duration multiplier, mean PGV/heavy probability, housing exposure, expected heavily/moderately damaged housing units, deaths and injuries. Each state saves `cfg`, resolved `sc`, `experiment`, `result`, and `caseProvenance` (including the experiment configuration, runtime and input/code fingerprints). The shared prepared grid is read-only. Sensitivity cases use numerical checks without timing or historical A/B regression checks; those regressions apply to matching primary settings. Alpha-zero cases match same-location 20 s results; alpha 0.25 matches B/C; Vs30 360 matches A. Repeat/reversed calculations and post-study primary recalculations must agree. Casualty monotonicity across every sweep is not an acceptance requirement.

The overlapping finite ruptures provide little separation in B/C final losses. Use `comparison/differences.csv` for measured heavy-unit, death and injury differences; the checks prescribe neither their magnitude nor their sign. On committed geometry, Python characterization gives C minus B approximately −1.05 heavy units, −0.058 deaths and −0.627 injuries. These values are not newly executed MATLAB results.

For full acceptance, including independent public entry points and byte preservation:

```matlab
root = run_acceptance();
```

This is slower because it rebuilds independent grids and exports videos. It compares scientific cell/LGU arrays and resolved scenario parameters, excluding timestamps, paths, and codec metadata. Nonempty destinations must be rejected without modification. Unit tests alone can be run with scoped paths:

```matlab
oldpath = path;
addpath('src','tests');
cfg = load_modsim_config(pwd);
checks = run_unit_tests(cfg, init_checks());
assert_all_passed(checks);
path(oldpath);
```

For `run_acceptance`, the production run root is `<acceptanceRoot>/batch/`. Require successful `batch/all_checks.csv`, scenario `checks.csv`, `comparison/checks.csv`, `sensitivity/checks.csv`, every experiment ledger, and `<acceptanceRoot>/acceptance_checks.csv`. The acceptance runner requires sensitivity coverage, saved states, actual runtime/provenance, all four production exports and sensitivity byte preservation through independent C/A/B/A runs. A failed video check means export is incomplete even if numerical results exist. Each `video_export.json` records actual profile, dimensions, frame count, playback settings, failures, and decode outcome. Codec selection encodes/decodes a temporary probe before production; MPEG-4 is preferred, with Motion JPEG AVI fallback. Numerical primary `state.mat` is saved first.

Inspect A/A.mp4 (or AVI), B/B.mp4, C/C.mp4, and comparison/ABC_comparison.mp4. Review saved `review_frame_*.png` and `final_frame.png`: labels must be readable and unclipped, LGU boundaries and West Valley Fault aligned, the correct assumed epicenter visible, inactive cells gray, and progression zero before arrival. Verify the adjacent counter label “ASSUMED timing: reveal of final expected totals” in all panels. The comparison has a common source-origin clock; completed maps and casualty values remain final while other panels continue. The final 48 frames are held at default settings. The renderer saves first, onset, completion and last source frames; inspect the corresponding decoded video frames too, using `frame_times.csv` to locate them. For comparison onset/completion, inspect each panel's transition.

`run_acceptance` creates `<acceptanceRoot>/visual_review.csv` with 16 PENDING rows (four phases per video). A human reviewer records PASS/FAIL, name, UTC review date, evidence paths/frame numbers and notes after watching the actual exports. All rows must be PASS with evidence before branch acceptance or delivery checklist completion. Automated checks passing does not finish this review. Preserve the runtime/codec metadata and completed review with the run directory.

The map is labelled “Assumed progression toward final heavy-damage probability.” Timing is an assumed linear reveal of final model expectations, not validated rupture or damage evolution. Simulated seconds differ from playback seconds. Use timeline.csv and animation_data.mat to check exact numerical onset/completion agreement; compression can change displayed pixels.

Prepared artifacts hold the static grid and wave arrivals. Scenario state contains final numerical results, resolved configuration, references, input/code hashes, and runtime metadata. Comparison inputs retain identities and fingerprints. Previous committed `results/scenarios` artifacts are historical references for A/B regressions; they are never overwritten by these runners.
