# Running and reviewing A/B/C

From the repository root in MATLAB:

```matlab
root = run_all();                       % unit tests, Kobe, A/B/C and sensitivities
[r, root, checks] = run_scenarios();    % A/B/C and sensitivities
[r, artifacts] = run_scenario('C');     % independent C only
```

Open `<runRoot>/comparison/ABC_comparison_viewer.html` directly in Edge, Chrome or another WebGL-capable browser. Each scenario also has `A/A_viewer.html`, `B/B_viewer.html` or `C/C_viewer.html`. These files include all data, scripts and styles and work without internet access or a local server. You can move/share an HTML by itself. The payload and manifest JSON files are for inspection and provenance.

A is assumed Pasig 20 s, B is Pasig 40 s, and C is Muntinlupa 40 s. B/C use assumed alpha 0.25. A/B isolates duration sensitivity; B/C compares location at equal duration. A single historical event does not identify duration effects. Near-identical B/C final losses follow from the largely overlapping 67 km rupture scenarios. The alternative 20 s case is an internal numerical control, not primary C.

The viewer starts paused at zero, with two simulated seconds per playback second. Use the scenario buttons for individual views or linked comparison. Play/pause, restart, change speed, or scrub in either direction. Drag to pan and scroll/pinch to zoom; north stays up. North-up reset restores the shared camera. Click an active cell to inspect final identity, population, PGV in cm/s, current displayed and final heavy probabilities as percentages, and expected deaths/injuries. The final LGU table is fixed; the separate NCR counters animate. Completed scenarios retain final values until the common endpoint, where playback stops.

Flat, unlit, contiguous tiles encode displayed heavy-damage probability using a shared sequential blue 0–10% scale, fixed across scenarios and time. Legend ticks are 0%, 2%, 4%, 6%, 8% and 10%; values ≥10% use the darkest fill without changing saved values. Inactive cells are gray; awaiting cells are gray-green. Amber shared edges between arrived and awaiting active cells mark the assumed arrival boundary from saved onset times. Assumed progression toward final heavy-damage probability remains `final_probability × clip((time − onset)/duration, 0, 1)`. LGU boundaries, West Valley Fault, assumed epicenters, north arrows and 5 km projected scale bars provide reference. The timing disclaimer remains visible when scrolling.

For every active cell, the browser uses only `clip((t - S_arrival)/duration, 0, 1)` times its saved final probability/losses. It does not recalculate ground motion, fragility, or casualty rates. Timing is an assumed reveal of final expectations, not validated rupture or damage evolution. Scientific assumptions remain in [ASSUMPTIONS.md](ASSUMPTIONS.md).

## Saved runs and video mode

```matlab
files = export_scenario_viewer(root);  % existing complete batch root
files = export_scenario_viewer(fileparts(artifacts.directory)); % independent root
root = run_all([], 'video');          % explicit legacy presentation
[r, root] = run_scenarios([], 'video');
[r, artifacts] = run_scenario('A', [], 'video');
```

Saved-run export reads `prepared/prepared.mat`, scenario `state.mat` and `animation_data.mat`. It writes only new/replacement viewer HTML, payload and manifest files; no scientific recalculation or state/CSV/video rewriting occurs. It requires one independent primary scenario or all three scenarios. It also works with older saved runs that predate `presentation.mode`. Original scientific provenance is retained, with separate current presentation source/dependency hashes in the manifest.

The optional output-root arguments remain compatible. Defaults create unique `results/runs/` directories; explicitly supplied runner destinations must be empty. `presentation.mode` in `config/modsim_config.json` defaults to `viewer` and can be overridden by the final runner argument. Numerical outputs and static maps are generated in both modes; default viewer runs do not probe codecs or create videos.

Legacy video mode uses the original 24 fps, quality 95, 2x playback, 2-second final hold, MPEG-4 with Motion JPEG AVI fallback, frame manifests and full-frame decoding checks. Existing video visual limitations and earlier evidence are preserved in [VIDEO-EXPORT-VERIFICATION.md](VIDEO-EXPORT-VERIFICATION.md).

## Numerical sensitivities and verification

Batch runners retain numerical duration studies (B/C alpha 0, 0.15, 0.25, 0.40), A site studies (Vs30 250, 360, 760 m/s) and the alternative 20 s internal control under `sensitivity/`. These use the same engine and produce no presentation exports. Independent runs create only their prepared inputs and selected scenario outputs.

```matlab
root = run_acceptance();             % default viewer, scientific/isolation checks
root = run_acceptance([], 'video');  % explicit legacy video acceptance
addpath('src','tests');
verify_viewer_payload(fullfile(root,'batch')); % compare all payload fields to saved MATLAB state
```

Acceptance requires passing batch, sensitivity, experiment, independent scenario and acceptance ledgers. Viewer checks require exported HTML/payload/manifests, static maps and no new videos; video mode retains encoding/decoding checks. The runner creates `visual_review.csv` for optional separate reviewer signoff. Browser acceptance and recorded agent visual review are documented in [VIEWER-VERIFICATION.md](VIEWER-VERIFICATION.md); automated payload checks alone do not establish browser behavior or visual readability.

See [viewer schema and test invocation](../viewer/README.md) for the standalone browser test. It checks local offline opening, no HTTP(S) requests, timing against MATLAB samples, all controls, cell selection, responsive comparison, north-up projection, final hold/stop, a WebGL-unavailable message and the measured 30 fps target. Inspect initial, onset, intermediate and final maps for readable labels and aligned overlays.
