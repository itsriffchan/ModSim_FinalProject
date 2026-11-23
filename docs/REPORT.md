# Grid-Based Casualties Simulation Following The Big One

**CS0019 — Modeling and Simulation**

Chan Reese, Ebrahim Fathi, Pacate Denienz, and Whitty Juan Angelo Roy

Updated: 2026-11-23 (Asia/Taipei)

## Abstract

This project implements a reproducible MATLAB model of earthquake damage and night-time indoor casualties across a simplified 500 m National Capital Region (NCR) grid. Historical evidence from the 1995 Hanshin-Awaji earthquake informs the damage relationships, while Philippine population, occupied housing units, administrative boundaries, and fault geometry describe exposure. The model combines BSSA14 median peak ground velocity (PGV), Yamaguchi and Yamazaki RC-average fragility, and Hazus conditional casualty rates. Three primary scenarios compare Pasig at 20 seconds (A), Pasig at 40 seconds (B), and Muntinlupa at 40 seconds (C).

The saved MATLAB batch gives approximately 4,598.6 expected deaths and 51,480.0 expected nonfatal injuries for A, 7,094.8 and 78,981.8 for B, and 7,094.7 and 78,981.2 for C. The A/B increase follows an assumed duration multiplier. B/C regional totals are nearly equal because their 67 km rupture segments largely overlap. These are conditional model expectations under unvalidated transfers and occupancy assumptions, not earthquake forecasts. Saved automated ledgers pass; human visual review of the exported presentations remains pending.

## 1. Objectives and scope

The project estimates spatial damage probabilities and expected casualties for an assumed magnitude 7.2 strike-slip earthquake on the West Valley Fault. Its required outputs are a color-coded damage grid, assumed epicenter and fault overlays, and separate death and injury summaries for all 17 NCR LGUs, including Pateros.

Ground motion, damage, and casualties are calculated as separate stages. The implementation uses base MATLAB, with no required additional toolbox or Simulink model. Calculations are deterministic: PGV is a median estimate and losses are probability-weighted expectations, so fractional casualty totals are valid model outputs.

### 1.1 Primary scenarios

| Scenario | Assumed epicenter | Local shaking duration | Duration exponent α | Comparison purpose |
|---|---|---:|---:|---|
| A | Pasig: 121.07011°E, 14.58000°N | 20 s | 0 | Baseline |
| B | Same Pasig point | 40 s | 0.25, assumed | A/B: assumed duration sensitivity |
| C | Muntinlupa: 121.04696°E, 14.40000°N | 40 s | 0.25, assumed | B/C: location comparison at equal duration |

Exposure, vulnerability, magnitude, site condition, fault trace, and rupture length remain fixed. Changing the assumed epicenter changes the selected rupture segment and arrival times. The former alternative 20-second scenario and illustrative point-source cases are legacy cases, excluded from the primary comparison. An alternative 20-second calculation is retained separately as a sensitivity control.

### 1.2 Results used in this report

All numerical result tables, grid statistics, and check counts below refer to one saved acceptance run:

`results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/`

Its `batch/` directory contains the primary calculations, Kobe summaries, prepared grid, sensitivity experiments, maps, and videos. This report uses the saved CSV ledgers and outputs; updating the report did not rerun MATLAB. The [video verification record](VIDEO-EXPORT-VERIFICATION.md) documents MATLAB R2026b Update 1 and the 2026-11-23 rerender of this batch. Saved states retain runtime and input/code provenance.

## 2. Data and historical evidence

### 2.1 Kobe reference

The cleaned Kobe reference contains nine wards. Its **1990-10-01 census population is 1,477,410**, and male plus female population equals the total in every ward. This denominator predates the **1995-01-17 earthquake** and does not represent the people present during shaking.

| Historical outcome | Reported total | Reporting date |
|---|---:|---|
| Deaths | 4,571 people | 2005-12-22 |
| Injuries | 14,678 people | 2000-01-11 |
| Full damage, 全壊 | 67,421 buildings | 1995-12-22 |
| Partial damage, 半壊 | 55,145 buildings | 1995-12-22 |

The saved [Kobe summary](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/kobe/kobe_city_descriptive_rates.csv) gives 3.093928 reported deaths and 9.934954 reported injuries per 1,000 residents counted in 1990. These are historical descriptions with different outcome reporting dates. They are not NCR casualty coefficients, and administrative full damage is not automatically physical collapse. The historical totals are not assumed to represent direct shaking losses alone.

Population, fragility coefficients, and ward outcomes occupy separate processed tables, with aggregate rows excluded from ward observations. Original observations remain separate from processed inputs and generated results.

### 2.2 NCR exposure and geometry

| Input | Source or method | Model quantity |
|---|---|---|
| Population | PSA 2020 Census of Population and Housing | 13,484,462 residents across 17 LGUs |
| Residential exposure | PSA 2020 occupied housing units and floor groups | 3,257,020 occupied housing units; 13,388,141 household residents |
| Spatial allocation | WorldPop 2020 constrained 100 m weights | Relative weights normalized to each PSA LGU total |
| LGU geometry | OCHA COD-AB v03, NAMRIA/PSA | NCR union area approximately 598.73 km² |
| Fault geometry | GEM Global Active Faults, PHL_31 | West Valley Fault trace; selected 67 km rupture per epicenter |
| Coordinates | EPSG:32651, WGS 84 / UTM zone 51N | Projected geometry in metres; model distances in kilometres |

The rectangular grid has 4,850 cells, of which **2,645 are active** and 2,488 have allocated population. A cell is active when it has positive area overlap with NCR. Fault crossing uses segment–cell intersection rather than a distance threshold; 100 cells are crossed by the full fault trace. Thirteen cells overlap Pateros. Cell–LGU overlap tables preserve shared boundary cells and LGU population and housing totals.

Occupied housing units are accommodation units, not building counts. WorldPop supplies allocation weights rather than authoritative population totals. The PSA population and boundary assignments retain the documented 2020 LGU crosswalk, including the pre-transfer treatment of EMBO. Source versions, acquisition instructions, transformations, and redistribution conditions are recorded in [data_sources.md](data_sources.md), [the grid method](ncr_grid_method.md), and [tools/README.md](../tools/README.md).

## 3. Model relationships

### 3.1 Ground motion and assumed duration sensitivity

For each active cell, BSSA14 estimates median RotD50 PGV in **cm/s** using magnitude 7.2, strike-slip mechanism, an assumed uniform \(V_{S30}=360\) m/s, and distance to the selected rupture. The geometric approximation for \(R_{JB}\) is minimum horizontal distance to a 67 km fault polyline, rather than a complete three-dimensional rupture surface. Epicentral distance is used separately for arrival timing.

Neither BSSA14 nor the selected fragility curve contains a duration term. The project introduces the following assumed sensitivity before evaluating fragility:

\[
v_{\mathrm{eff}}=v\left(\frac{T}{20\,\mathrm{s}}\right)^\alpha.
\]

At 40 seconds and α = 0.25, the multiplier is approximately **1.189207**. It is applied once. A single historical earthquake does not identify this duration effect; A/B explores the consequences of the stated assumption. The saved scenario PGV column contains the effective PGV supplied to fragility.

### 3.2 Damage probabilities

The selected Yamaguchi and Yamazaki (2000) relationship is RC, average construction period, using natural logarithms and PGV in cm/s:

\[
P_H=\Phi\left(\frac{\ln(v_{\mathrm{eff}})-5.71}{0.849}\right),
\qquad v_{\mathrm{eff}}>0.
\]

The heavy-plus-moderate curve uses λ = 5.11 and ζ = 0.798. Both cumulative probabilities are zero at zero PGV. Mutually exclusive states are heavy, moderate-only \(P_{M+}-P_H\), and below-moderate \(1-P_{M+}\). Heavy and heavy-plus-moderate probabilities are not added together. Implementation checks include \(P_H(100\,\mathrm{cm/s})\approx0.0965726\) and \(P_H(\exp(5.71))=0.5\).

These curves transfer a Japanese survey relationship to NCR occupied housing units. Matching PGV units does not establish compatibility between BSSA14 RotD50 and the source survey's intensity-measure convention. The transfer and the use of one RC-average class remain unvalidated.

### 3.3 Deaths, nonfatal injuries, and LGU aggregation

Within each LGU, occupants per housing unit equal PSA household population divided by occupied housing units. Night-time indoor exposure uses the assumed 2:00 a.m. fraction **0.98901**. Institutional and other non-household residents do not contribute to this residential occupancy calculation, although rates per 1,000 use total census residents as their denominator.

An assumed crosswalk maps heavy damage to Hazus Complete, split into collapse and no-collapse outcomes; moderate-only maps to Hazus Moderate. Below-moderate contributes zero modeled casualties because the available curves combine undamaged and slightly damaged units. Floor groups are mapped to Hazus C1L/C1M/C1H classes. For a cell and exposure class, expected losses have the form

\[
E[L]=N_{\mathrm{indoor}}\left[P_M r_M+P_H\left((1-c)r_{CN}+c r_{CC}\right)\right],
\]

where \(c\) is collapse probability conditional on Complete damage. Separate rate vectors produce deaths (Hazus severity 4) and nonfatal injuries (severities 1–3); published percentages are converted to fractions. This calculation supplies the conditional casualty relationship that would be missing if damage probability were multiplied directly by residents.

The current engine first sums losses within each cell and then apportions cell totals to overlapping LGUs by their housing-unit shares. This conserves NCR totals, but can blend LGU occupancy and height-class differences within shared cells. Housing-share apportionment is a further spatial aggregation approximation. Saved LGU and cell totals are checked for agreement.

### 3.4 Arrival and animation timing

Simplified arrivals use straight-line hypocentral distance, assumed depth 12.5 km, P-wave speed 6.0 km/s, and S-wave speed 3.5 km/s. The display progression after local S arrival is

\[
f_i(t)=\operatorname{clip}\left(\frac{t-t_{S,i}}{T},0,1\right).
\]

Displayed heavy probability and cumulative expected casualties are their final saved arrays multiplied by \(f_i\). This is an **assumed reveal of final expectations**, not a validated rupture or damage-evolution simulation. A separately labeled normalized shaking illustration does not drive losses. Timing arrays are sampled every 0.25 simulated seconds; completed scenarios retain their final state on the shared comparison clock.

## 4. Results and discussion

### 4.1 Primary A/B/C totals

Source: saved [scenario comparison](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/comparison/scenario_comparison.csv). Each scenario has 3,257,020 occupied housing units. Damage counts below retain that exposure unit. Casualties are night-time indoor expectations, rounded to one decimal; rates use 2020 total residents.

| Scenario | Duration | Expected heavily damaged housing units | Expected deaths | Expected nonfatal injuries | Deaths per 1,000 residents |
|---|---:|---:|---:|---:|---:|
| A: Pasig | 20 s | 91,069.4 | 4,598.6 | 51,480.0 | 0.3410 |
| B: Pasig | 40 s | 140,421.1 | 7,094.8 | 78,981.8 | 0.5261 |
| C: Muntinlupa | 40 s | 140,420.0 | 7,094.7 | 78,981.2 | 0.5261 |

**Duration comparison.** B exceeds A by 49,351.7 expected heavily damaged housing units, 2,496.2 expected deaths, and 27,501.8 expected nonfatal injuries. The expected death increase is approximately **54.28%** under the assumed α = 0.25 treatment. It is a sensitivity result, not an observed causal estimate of doubling duration.

**Location comparison.** The saved C-minus-B differences are −1.049606 expected heavily damaged housing units, −0.057708 expected deaths, and −0.626782 expected nonfatal injuries. Both selected 67 km ruptures overlap across most of the NCR fault trace, leaving little separation in regional totals. This does not establish that the epicenter is generally unimportant. Individual cell probabilities and assumed arrival times can differ even when regional totals are nearly equal; no equality between B and C is imposed. Exact differences are retained in [differences.csv](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/comparison/differences.csv).

### 4.2 Casualties by LGU

Sources: the same batch's [A](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/A/lgu.csv), [B](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/B/lgu.csv), and [C](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/C/lgu.csv) LGU tables. Rows are ranked by A expected deaths. All injury columns are nonfatal expectations. Rounded row values may not sum exactly to the regional totals.

| LGU | 2020 population | A deaths | A injuries | B deaths | B injuries | C deaths | C injuries |
|---|---:|---:|---:|---:|---:|---:|---:|
| Quezon City | 2,960,048 | 1,194.7 | 13,236.1 | 1,837.8 | 20,248.7 | 1,837.8 | 20,248.5 |
| Taguig City | 886,722 | 565.4 | 6,256.6 | 844.4 | 9,293.1 | 844.4 | 9,293.1 |
| City of Pasig | 803,159 | 457.6 | 5,093.5 | 689.1 | 7,628.1 | 689.1 | 7,628.1 |
| City of Muntinlupa | 543,445 | 339.2 | 3,721.6 | 506.6 | 5,527.3 | 506.6 | 5,527.3 |
| City of Parañaque | 689,992 | 310.6 | 3,436.0 | 475.8 | 5,234.5 | 475.8 | 5,234.5 |
| City of Marikina | 456,059 | 279.5 | 3,059.1 | 419.4 | 4,565.0 | 419.4 | 4,565.0 |
| City of Manila | 1,846,513 | 270.0 | 3,093.3 | 447.1 | 5,090.4 | 447.1 | 5,090.4 |
| City of Makati | 629,616 | 264.4 | 3,194.3 | 401.8 | 4,823.8 | 401.8 | 4,823.8 |
| Caloocan City | 1,661,584 | 248.4 | 2,768.7 | 413.0 | 4,574.8 | 413.0 | 4,574.4 |
| City of Las Piñas | 606,293 | 184.1 | 2,034.7 | 291.3 | 3,200.9 | 291.3 | 3,200.9 |
| City of Mandaluyong | 425,758 | 177.0 | 2,081.8 | 270.7 | 3,164.6 | 270.7 | 3,164.6 |
| Pasay City | 440,656 | 124.2 | 1,436.4 | 196.5 | 2,257.2 | 196.5 | 2,257.2 |
| City of Valenzuela | 714,978 | 56.7 | 636.3 | 98.5 | 1,098.6 | 98.5 | 1,098.6 |
| City of San Juan | 126,347 | 47.8 | 547.7 | 74.0 | 842.5 | 74.0 | 842.5 |
| **Pateros** | **65,227** | **39.6** | **439.8** | **59.1** | **652.1** | **59.1** | **652.1** |
| City of Malabon | 380,522 | 26.3 | 295.9 | 46.3 | 516.7 | 46.3 | 516.7 |
| City of Navotas | 247,543 | 13.2 | 148.4 | 23.5 | 263.6 | 23.5 | 263.6 |

Quezon City has the largest expected casualty count in A. Counts also reflect exposure: the largest totals do not necessarily indicate the highest rates. For A, Taguig has approximately 0.638 expected deaths per 1,000 residents, Muntinlupa 0.624, Marikina 0.613, and Pateros 0.607.

Pateros is retained despite its small mapped area, approximately 1.61 km² in the selected boundary dataset. The mapped fault does not enter its LGU polygon. A cell overlapping Pateros may still be fault-crossed in a neighboring LGU's part of that cell; a cell flag does not establish a fault crossing of Pateros itself.

### 4.3 Sensitivity to duration exponent

Source: saved [duration experiments](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/sensitivity/duration_alpha_sensitivity.csv). All cases below use 40 seconds and \(V_{S30}=360\) m/s. Mean heavy probability is the unweighted mean over active cells, not a population-weighted NCR damage rate.

| Location | α | Mean heavy probability | Expected heavily damaged housing units | Expected deaths | Expected nonfatal injuries |
|---|---:|---:|---:|---:|---:|
| Pasig | 0 | 0.02926 | 91,069.4 | 4,598.6 | 51,480.0 |
| Pasig | 0.15 | 0.03802 | 118,573.8 | 5,989.5 | 66,824.0 |
| Pasig | 0.25 | 0.04496 | 140,421.1 | 7,094.8 | 78,981.8 |
| Pasig | 0.40 | 0.05723 | 179,140.4 | 9,054.4 | 100,476.4 |
| Muntinlupa | 0 | 0.02921 | 91,068.6 | 4,598.6 | 51,479.6 |
| Muntinlupa | 0.15 | 0.03796 | 118,572.9 | 5,989.5 | 66,823.5 |
| Muntinlupa | 0.25 | 0.04490 | 140,420.0 | 7,094.7 | 78,981.2 |
| Muntinlupa | 0.40 | 0.05716 | 179,139.1 | 9,054.4 | 100,475.7 |

At α = 0, duration does not change the final damage or casualty calculation: Pasig reproduces A and Muntinlupa reproduces the separate alternative 20-second control. At α = 0.25 the cases reproduce B and C. Increasing α increases the effective PGV and losses in these saved experiments, illustrating how strongly the assumed duration treatment can influence the result.

### 4.4 Sensitivity to site condition

Source: saved [site experiments](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/sensitivity/vs30_sensitivity_A.csv). These cases use A's Pasig epicenter and 20-second duration. Each site velocity is assumed uniformly across NCR.

| Assumed Vs30 (m/s) | Mean PGV (cm/s) | Mean heavy probability | Expected deaths | Expected nonfatal injuries |
|---:|---:|---:|---:|---:|
| 250 | 62.14 | 0.03425 | 5,426.1 | 60,640.3 |
| 360, default | 57.95 | 0.02926 | 4,598.6 | 51,480.0 |
| 760 | 35.93 | 0.00763 | 1,183.8 | 13,470.2 |

The 360 m/s case reproduces A. The 760 m/s case reduces mean heavy probability to roughly one quarter of the default, showing that uniform site condition is a material assumption. These alternatives are sensitivity cases, not a measured NCR site map or confidence interval.

### 4.5 MMEIRS benchmark

The project's documented MMEIRS 2004 Model 08 benchmark reports 33,500 deaths and 113,600 injuries against a 2000 population of 9,932,560, approximately 3.37 deaths per 1,000. A gives 0.341 expected deaths per 1,000 against 2020 residents. MMEIRS also reports heavily damaged residential **buildings**, while this model reports expected damaged **occupied housing units**; those counts are not directly interchangeable.

Population vintage, exposure inventory, shaking, vulnerability, and loss methods differ. The benchmark provides context and does not independently validate this model. No parameter was selected to force agreement with the benchmark. Its source and scope are recorded in [data_sources.md](data_sources.md).

## 5. Maps and presentation outputs

The saved batch includes [the NCR base map](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/prepared/ncr_base_map.png), [A's heavy-damage probability map](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/A/p_heavy.png), [the A/B/C damage comparison](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/comparison/p_heavy.png), [LGU casualty charts](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/comparison/lgu_casualties_ABC.png), and [casualty timelines](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/comparison/casualty_timeline.png). These maps show probabilities or expectations, rather than observed damage categories.

Static scientific maps and legacy videos use north-up projected geometry, equal geographic axis scaling, inactive-cell masks, fault and epicenter overlays, and shared probability limits across scenarios. Legacy video probability limits are 0–1. Current standalone interactive heatmaps use a shared **0–10%** sequential blue probability scale; values at or above 10% saturate visually while numerical inspection preserves the saved probability. Color scales must therefore be read from each presentation's legend.

Default runs create self-contained offline HTML viewers. A separate Next.js website provides Region, City Perspective, and Compare views of saved payloads. Its external map context requires network access; standalone HTML remains the offline option. Presentation interpolation does not recalculate ground motion, fragility, or casualties. OSM building shapes and map context do not supply a verified structural inventory or building-specific damage estimate. Standalone browser evidence is in [VIEWER-VERIFICATION.md](VIEWER-VERIFICATION.md); Next.js evidence is tracked separately in [the viewer handoff](view-context/README.md).

## 6. Verification and remaining review

### 6.1 Saved automated checks

| Ledger in the selected acceptance run | PASS | FAIL | SKIPPED |
|---|---:|---:|---:|
| [batch/all_checks.csv](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/all_checks.csv) | 759 | 0 | 0 |
| [batch/sensitivity/checks.csv](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/batch/sensitivity/checks.csv) | 507 | 0 | 0 |
| [acceptance_checks.csv](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/acceptance_checks.csv) | 32 | 0 | 0 |

The ledgers overlap in scope and should not be added as independent test totals. The historical `results/all_checks.csv` ledger of 116 PASS and one SKIPPED belongs to an older workflow and is not the acceptance evidence for the current batch.

Checks cover projection against independent test vectors; synthetic geometry; fragility reference values and zero input; ground-motion implementation; unique joins; population and housing conservation; finite bounded probabilities and nonnegative losses; cell/LGU aggregation; all 17 LGUs and Pateros; stored A/B regression; assumed local timing and final-state agreement; sensitivity controls and parameter coverage; repeated and reordered calculations; and independent C/A/B/A runs matching batch results while preserving other saved artifacts. Agreement with prior calculations verifies implementation consistency, not Philippine predictive validity.

### 6.2 Video exports and visual review

All four production export reports in this batch record `exported_and_decoded`, MPEG-4, 24 fps, and empty error/exception lists. Playback uses two simulated seconds per playback second and a 48-frame final hold.

| Export | Pixel dimensions | Encoded frames | Decoded frames | Simulation horizon |
|---|---:|---:|---:|---:|
| A | 1280 × 960 | 397 | 397 | 29 s |
| B | 1280 × 960 | 637 | 637 | 49 s |
| C | 1280 × 960 | 685 | 685 | 53 s |
| ABC comparison | 1920 × 1080 | 685 | 685 | 53 s |

The 2026-11-23 layout correction rerendered these videos without recalculating scientific arrays. The [verification record](VIDEO-EXPORT-VERIFICATION.md) reports separated standalone text and readable comparison titles in agent inspection of final frames. **Human phase-by-phase visual acceptance remains pending:** the selected run's [visual_review.csv](../results/runs/20261123T125422_tpeaa1c0df_2e9a_4bf0_8109_705ecb4e78ed/visual_review.csv) contains 16 PENDING rows covering first, onset, completion, and final phases for A, B, C, and the comparison.

A reviewer should inspect the actual videos and corresponding frames for readable labels, fault/epicenter alignment, inactive masks, shared colors, casualty totals, and comparison timing, then record reviewer, UTC review time, evidence, status, and findings. Export/decoding success and agent inspection do not establish human signoff.

## 7. Limitations

1. **Unvalidated vulnerability and intensity transfers.** Japanese RC-average fragility and the BSSA14-to-survey PGV convention have not been validated against a compatible Philippine damage dataset. Similar strike-slip mechanisms do not establish identical shaking or vulnerability.
2. **Exposure and class approximations.** Occupied housing units are not buildings. The model uses one RC-average fragility class, an assumed floor-to-Hazus crosswalk, generic collapse rates, and housing-share allocation of cell casualties to LGUs.
3. **Assumed duration effect.** The exponent and PGV multiplier are sensitivity choices. The observed historical event does not establish a causal 20-to-40-second loss relationship.
4. **Simplified source, site, and spatial resolution.** Ruptures are fault polylines, site velocity is uniform, and each 500 m cell uses representative shaking. Near-equal B/C regional losses are specific to these overlapping ruptures. The configured 1,000 m grid alternative is not included in this batch's sensitivity studies.
5. **Restricted occupancy and damage coverage.** Exposure is based on 2020 night-time household residents. Daytime redistribution, visitors, institutional occupancy, outdoor casualties, and below-moderate damage casualties are outside the calculation.
6. **Excluded secondary and delayed losses.** Fire, liquefaction, tsunami, landslides, aftershocks, rescue constraints, delayed deaths, and hospital-function losses are omitted.
7. **No probabilistic uncertainty interval.** Median shaking and expected losses do not propagate ground-motion, fragility, occupancy, or casualty-rate uncertainty. Parameter sweeps are not forecast confidence bounds.
8. **Assumed timing and pending presentation acceptance.** Constant-speed arrivals and linear progression are illustrative. Automated verification does not replace the remaining recorded visual review.

## 8. Conclusions

The MATLAB workflow produces spatial damage probabilities, fault and assumed epicenter overlays, and separate casualty summaries for all 17 NCR LGUs. Under the selected assumptions, A gives approximately 4,598.6 expected deaths and 51,480.0 expected nonfatal injuries. The assumed 40-second treatment increases losses to approximately 7,094.8 and 78,981.8 in B. Shifting the epicenter to Muntinlupa at the same duration produces nearly equal regional losses in C because the selected finite ruptures largely overlap.

The sensitivity studies show that duration scaling and site velocity materially affect the outputs. The model provides a reproducible course simulation for examining these relationships. Its numerical checks support implementation consistency; local predictive validity requires better exposure classes, site information, compatible independent observations, and explicit uncertainty treatment. Recorded human visual acceptance is still needed before the presentations are treated as fully reviewed deliverables.

## 9. Reproduction and supporting references

From the repository root in MATLAB:

```matlab
root = run_all();                         % unit/Kobe/A/B/C/sensitivity; default viewer
[r, artifacts] = run_scenario('C');       % independent primary scenario
root = run_acceptance([], 'video');      % fresh batch and independent video checks
```

Each runner creates a new unique destination under `results/runs/`; an explicitly supplied destination must be empty. Reproduction creates new results rather than overwriting the selected evidence run. Scientific state files retain resolved settings, source references, SHA-256 input/code fingerprints, Git revision/dirty status, and runtime metadata. The evidence run is generated material; preserve or package it with the report so its linked figures and CSVs remain available.

| Reference | Project use and supporting record |
|---|---|
| City of Kobe census and earthquake outcome tables | Historical ward population, outcome definitions, and reporting dates; [data sources, section 1](data_sources.md#1-kobe-1995-reference-already-in-the-repository-cleaned-in-this-branch) |
| PSA 2020 CPH; WorldPop; OCHA COD-AB; GEM Global Active Faults | NCR exposure, allocation, boundaries, and fault trace; [data sources, section 2](data_sources.md#2-ncr-exposure-and-geography) |
| Yamaguchi and Yamazaki (2000), 12WCEE paper 2451, Eq. (1), Tables 3–4 | RC-average damage fragility; coefficient provenance in [data_sources.md](data_sources.md) |
| Boore, Stewart, Seyhan, and Atkinson (2014), Earthquake Spectra 30(3), 1057–1085 | Median PGV relationship; coefficient source and component qualification in [data sources, section 3](data_sources.md#3-ground-motion-damage-and-casualties) |
| FEMA Hazus 6.1 Earthquake Model Technical Manual (July 2024), Section 12 | Indoor occupancy, conditional casualty rates, and collapse probabilities; [assumptions](ASSUMPTIONS.md) and [data sources](data_sources.md) |
| JICA/MMDA/PHIVOLCS MMEIRS (2004), Model 08 | Scenario magnitude/rupture assumptions and contextual benchmark; [data_sources.md](data_sources.md) |
| Project methods and execution records | [Grid method](ncr_grid_method.md), [run instructions](DEMO.md), [video verification](VIDEO-EXPORT-VERIFICATION.md), and [standalone viewer verification](VIEWER-VERIFICATION.md) |

The source register provides external URLs, versions, dates, units, transformations, and redistribution conditions. Historical research notes and the former S-series CSVs remain available as background; they do not replace the A/B/C evidence identified here.
