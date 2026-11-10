# Project guidance

## Objective

Build a reproducible MATLAB simulation of earthquake damage and casualties across a simplified NCR grid. Use the 1995 Hanshin-Awaji/Kobe earthquake as historical evidence for model relationships, then apply Philippine geography and exposure. Simulink is optional unless the course requires it.

Required outputs are a color-coded damage grid, the assumed epicenter and West Valley Fault overlay, and casualty summaries by city/LGU, including Pateros. Compare a 20-second baseline, 40 seconds at the same epicenter, and 20 seconds at an alternative epicenter.

## Repository layout and current state

- `data/raw/`: original downloads. Preserve these files unchanged.
- `data/processed/`: cleaned, analysis-ready inputs with one observation per row.
- `src/`: reusable MATLAB functions.
- `models/`: optional Simulink models.
- `results/`: generated figures, tables, and saved run settings.
- `docs/data_sources.md`: provenance, definitions, units, and assumptions.
- `starter.m`: existing RC heavy-damage fragility demonstration. Run `starter` from the repository root.
- `run_all.m`: currently empty; intended future entry point for the complete workflow.
- `README.md`: brief project checklist. Update checkboxes only when work is verified.

The initial review found population records in `data/processed/fragility_parameters.csv`, an empty `kobe_ward_population.csv`, and duplicate total rows in `kobe_ward_outcomes.csv`. Track these as cleanup tasks until resolved. Inspect the current files before making changes; this description may become outdated.

## Data handling

- Keep original observations separate from cleaned data, assumed inputs, model parameters, and generated results.
- Record source URL/file, reference date, reporting date, geographic coverage, units, transformations, and redistribution conditions. Do not commit data whose terms prohibit redistribution; provide acquisition instructions instead.
- Use stable ward/LGU names or geographic codes for joins. Detect duplicate and missing keys. Missing values must not silently become zeros.
- Keep numeric CSV columns numeric, use UTF-8 for Japanese names, and use ISO dates. Exclude aggregate total rows from observation tables.
- The Kobe reference population is the 1990-10-01 census, not the population present during the 1995-01-17 earthquake. Preserve that distinction in rate labels.
- Whole-ward totals in the supplied census sheets are on row 5: D5 households, E5 total population, F5 male population, G5 female population. Do not sum these totals with neighborhood/subdivision records.
- Expected extraction checks: nine wards, population 1,477,410, and male plus female population equals total population for every ward.
- Reported Kobe outcome controls are 4,571 deaths, 14,678 injuries, 67,421 full-damage buildings, and 55,145 partial-damage buildings. Preserve category definitions and their different reporting dates. These are historical reporting totals, not automatically direct shaking-only losses.

## Modeling rules

- Similar strike-slip mechanisms make Kobe a useful analogue; they do not establish identical ground motion, building vulnerability, or casualty rates in NCR.
- Document and keep separate the ground-motion, building-damage, and casualty relationships. Population is not a building count. A building-damage probability multiplied directly by population is not a justified casualty model.
- Use one suitable projected coordinate system for distance calculations. Express distances in km and preserve the intensity measure's units. Calculate fault distance to line segments and fault crossings by cell intersection.
- The current reproduction uses Yamaguchi and Yamazaki (2000), 12WCEE paper 2451, Equation (1), page 4, Table 3, page 5: RC, average construction period, heavy damage, PGV in cm/s, lambda 5.71, zeta 0.849.
- That relationship is `P = Phi((ln(PGV) - lambda) / zeta)` for positive PGV, with probability zero at PGV zero. MATLAB `log` is the natural logarithm. Keep the selected class, threshold, and units with the coefficients.
- Source: https://www.iitk.ac.in/nicee/wcee/article/2451.pdf . Treat the Japanese average construction-period mix as a source-specific model, not a validated Philippine inventory.
- Do not substitute epicenter distance, PGA, or a normalized shaking index for PGV. Any conversion requires a documented supporting relationship.
- Distinguish heavy damage from heavy-plus-moderate damage. Cumulative damage thresholds overlap and must not be added as separate categories. Administrative full damage is not automatically literal physical collapse.
- Model fatalities and injuries separately where possible. Preserve occupancy assumptions and distinguish direct losses from fire, rescue, and delayed effects.
- A single historical event does not identify the effect of increasing duration from 20 to 40 seconds. Describe that comparison as an assumed sensitivity experiment unless a supported duration-dependent relationship is implemented.
- Hold exposure, vulnerability, fault geometry, and unrelated parameters fixed across the three scenarios. Save random seeds when randomness is introduced.
- Label synthetic examples, assumed rates, and unvalidated transfers explicitly. Do not invent local building inventories or describe illustrative outputs as earthquake forecasts.

## Implementation and verification

- Prefer simple MATLAB functions with explicit inputs/outputs. Separate loading, geometry, calculations, aggregation, and plotting. Keep parameters in one authoritative configuration or input table.
- Establish a small synthetic-grid calculation before scaling to NCR. Build the MATLAB engine before adding Simulink.
- Require additional toolboxes only when necessary and document them. The existing fragility demo uses built-in `erfc` rather than `normcdf`.
- For numerical changes, run the affected MATLAB workflow and meaningful checks: probability bounds, zero-input behavior, expected monotonicity, population conservation, unique joins, LGU/NCR aggregation, and repeatability.
- For the current RC curve, PGV 100 cm/s gives approximately 0.0965726 heavy-damage probability. At `PGV = exp(lambda)`, the probability is 0.5. These check implementation, not transfer validity.
- Use a compatible independent record for validation when available. Agreement with data used to fit a model is not independent validation.
- For maps, use equal axis scaling, north-up orientation, an explicit inactive-cell mask, and consistent color limits across scenarios. Show units, legends, and scenario settings.
- In Simulink, verify final outputs against MATLAB for identical inputs. Do not sum cumulative casualty estimates repeatedly over time steps.
- Save the configuration and provenance needed to reproduce results. Report which checks ran and any material limitations; do not claim a run passed without evidence.
- Keep changes within the requested scope. Do not rewrite raw data or repair unrelated files merely while editing documentation.
