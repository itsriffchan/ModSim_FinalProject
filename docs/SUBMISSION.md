# Submission Checklist

## Required

1. Final report PDF or DOCX
2. MATLAB source code
3. Processed input data
4. A/B/C result tables
5. Heavy-damage maps
6. A/B/C totals chart
7. Presentation slides
8. MATLAB demonstration

## Recommended MATLAB files

Keep these entry points:

- `demo_scenario.m`
- `run_all.m`
- `run_scenarios.m`
- `run_scenario.m`
- `run_acceptance.m`

Keep `src/` and `tests/` because the entry points call their functions.

## Recommended presentation assets

Use:

- `results/report_figures/abc_totals.png`
- `results/report_figures/abc_damage_probability.png`
- `results/report_figures/scenario_A_results.png`
- `results/report_figures/scenario_B_results.png`
- `results/report_figures/scenario_C_results.png`
- One synchronized A/B/C MP4

For the live demo, open `demo_scenario.m`, run one scenario, and show the printed totals and viewer.

## Evidence that may be omitted

For a concise submission, omit:

- Duplicate independent runs
- Sensitivity-run copies
- Video review-frame PNGs
- Intermediate `.mat` and frame-manifest files
- Legacy S-series results
- Hosted Next.js build output and `node_modules`
- Local browser screenshots and test logs

Keep one verified A/B/C batch and its acceptance ledgers if verification evidence is requested.

## Final review

Before submission:

- Confirm A, B, and C use the final 20/40/40-second settings.
- Confirm the report does not call C a 20-second alternative.
- Complete human visual review of the presentation videos.
- Confirm Pateros appears in every LGU summary.
- Label all casualty and damage totals as model expectations.
