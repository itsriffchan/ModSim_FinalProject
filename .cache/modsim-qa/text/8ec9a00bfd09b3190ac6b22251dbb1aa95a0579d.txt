# ModSim_FinalProject
# ModSim Final Project

Kobe-informed, grid-based earthquake damage and casualty scenarios for NCR using MATLAB, with optional Simulink.

- [x] Set up the repository and project folders.
- [x] Collect Kobe outcomes and the nine 1990 ward census workbooks.
- [x] Reproduce the published RC heavy-damage curve (`starter.m`).
- [x] Put population data in `data/processed/kobe_ward_population.csv`; it is currently in `fragility_parameters.csv`.
- [ ] Remove duplicate total rows from the processed outcomes; retain nine ward records.
- [ ] Save actual fragility coefficients under `data/processed/fragility_parameters.csv`.
- [ ] Complete `docs/data_sources.md` with sources, dates, units, and assumptions.
- [ ] Join Kobe population and outcomes; verify totals and calculate descriptive rates.
- [ ] Collect matching NCR boundaries, population, West Valley Fault geometry, and building exposure.
- [ ] Build the NCR grid and calculate epicenter/fault distances and fault crossings.
- [ ] Select a supported cell-level ground-motion model and justify local building fragility choices.
- [ ] Implement damage and a separate casualty model with documented assumptions.
- [ ] Compare baseline (20 s), longer shaking (40 s), and alternative epicenter (20 s).
- [ ] Verify bounds, totals, repeatability, and sensitivity to assumptions.
- [ ] Generate damage maps, casualty charts by city/LGU, and scenario comparisons.
- [ ] Make `run_all.m` reproduce the workflow; add Simulink if needed.
- [ ] Finish the report, limitations, and demonstration.
