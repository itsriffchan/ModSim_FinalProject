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

Review `<runRoot>/all_checks.csv`, scenario `checks.csv`, and `comparison/checks.csv`. A failed video check means export is incomplete even if numerical results exist. Each `video_export.json` records actual profile, dimensions, frame count, playback settings, failures, and decode outcome. Codec selection encodes/decodes a temporary probe before production; MPEG-4 is preferred, with Motion JPEG AVI fallback. Numerical `state.mat` is saved first.

Inspect A/A.mp4 (or AVI), B/B.mp4, C/C.mp4, and comparison/ABC_comparison.mp4. Review saved `review_frame_*.png` and `final_frame.png`: labels must be readable and unclipped, LGU boundaries and West Valley Fault aligned, the correct assumed epicenter visible, inactive cells gray, and progression zero before arrival. The comparison has a common source-origin clock; completed maps and casualty values remain final while other panels continue. The final 48 frames are held at default settings. Record this visual review separately; automatic decoding cannot establish readability.

The map is labelled “Assumed progression toward final heavy-damage probability.” Timing is an assumed linear reveal of final model expectations, not validated rupture or damage evolution. Simulated seconds differ from playback seconds. Use timeline.csv and animation_data.mat to check exact numerical onset/completion agreement; compression can change displayed pixels.

Prepared artifacts hold the static grid and wave arrivals. Scenario state contains final numerical results, resolved configuration, references, input/code hashes, and runtime metadata. Comparison inputs retain identities and fingerprints. Previous committed `results/scenarios` artifacts are historical references for A/B regressions; they are never overwritten by these runners.
