# Report: Grid-based casualties for a West Valley Fault earthquake in NCR

**CS0019 — Grid-Based Casualties Simulation Following The Big One.**  
Engine: base MATLAB only. These numbers come from a headless `matlab -batch "run_all"` on branch `feature/steps5-17`, MATLAB R2026a Update 5 (26.1.0.3346908), Windows 11, finished at **12:27 PM Asia/Singapore on 13 November 2026**. Exit code 0. **101 checks PASS, 0 FAIL, 1 SKIPPED** (C18 Mapping Toolbox, not installed and not required). They are **model outputs**, not observations.

## 1. What was built (steps 5–17)

| Steps | What |
|---|---|
| 4 (honesty fix) | `kobe_ward_population.csv` now holds the nine-ward 1990-10-01 census (1,477,410). Outcomes are nine wards with no total rows, and reporting dates kept distinct. `fragility_parameters.csv` holds Yamaguchi & Yamazaki (2000) Tables 3–4, not population. |
| 5–8 | `run_kobe.m`: verifies the cleaned tables, inner-joins on English ward name, writes descriptive rates per 1,000 **1990-census** residents (not 1995 present population), and a bar chart. City-wide: 4,571 / 1,477,410 × 1,000 = **3.093928** deaths and **9.934954** injuries per 1,000. These are event summaries, not NCR coefficients. Fragility implementation check: \(P_\mathrm{heavy}(100\,\mathrm{cm/s})=0.0965726316\). |
| 9–10 | `run_ncr_grid.m`: 500 m grid, origin (274500, 1587500), 50×97 = 4,850 cells, **2,645 active**, 100 fault-crossed, 13 Pateros cells, 2,488 populated; dasymetric PSA 2020 population **13,484,462.0**; 3,257,020 occupied housing units; 67.00 km ruptures at both epicenters; C01–C16; maps. Maximum cell population is 41,726.8 (higher than a ~33,300 pre-check; LGU totals still conserve). |
| 11–12 | BSSA14 median RotD50 PGV (cm/s), strike-slip, \(M_w=7.2\), assumed \(V_{S30}=360\) m/s. Implementation: PGV(\(R_{JB}=0\)) = 77.1128 cm/s, PGV(\(R_{JB}=10\)) = 41.7464 cm/s. Yamaguchi RC-average heavy and heavy+moderate curves. |
| 13–14 | Hazus 6.1 indoor casualty rates, night-time (2 a.m.), indoor fraction 0.98901. Official S1 / S2 / S3 and illustrative point-source S1p / S3p. LGU aggregation includes Pateros. |
| 15–16 | Maps with shared colour limits, LGU bar charts, \(V_{S30}\) and α sensitivity, MMEIRS Model 08 benchmark table (not validation). |
| 17 | This report, `docs/data_sources.md`, `docs/ASSUMPTIONS.md`, `docs/ncr_grid_method.md`, `docs/DEMO.md`, and `results/all_checks.csv`. |

`starter.m` and `inspect_jma_kobe.m` are unchanged. The JMA accelerogram is optional and was not required. Only base MATLAB is installed on the machine that ran this; the Mapping Toolbox is absent, which is why C18 is SKIPPED.

## 2. Method in one paragraph

For each 500 m cell, the model takes Joyner–Boore distance to a 67 km subset of the GEM PHL_31 West Valley Fault, evaluates BSSA14 median PGV, applies the Yamaguchi & Yamazaki (2000) RC-average fragility (heavy / moderate-only / below-moderate), maps those states to Hazus Complete / Moderate / Slight with an **assumed** crosswalk, and multiplies by night-time indoor occupants in PSA occupied housing units. Three official scenarios share the same exposure, vulnerability, magnitude and fault; they differ only by duration treatment (S2) or rupture centre (S3). Expected deaths and injuries are means, not simulation draws.

## 3. Results

### 3.1 Official and illustrative scenarios

From `results/scenarios/scenario_comparison.csv`. Occupied housing units are 3,257,020 in every scenario.

| Scenario | Role | Duration (s) | α | Heavily damaged units | Expected deaths | Expected injuries | Deaths per 1,000 residents |
|---|---|---:|---:|---:|---:|---:|---:|
| S1_baseline_20s | official | 20 | 0 | 91,069.4 | 4,598.6 | 57,470.9 | 0.3410 |
| S2_baseline_40s | official, **assumed** duration | 40 | 0.25 | 140,421.1 | 7,094.8 | 84,709.2 | 0.5261 |
| S3_alt_67km_20s | official | 20 | 0 | 91,068.6 | 4,598.6 | 57,470.4 | 0.3410 |
| S1p_base_point_20s | illustrative point-source | 20 | 0 | 41,800.5 | 2,035.4 | 29,502.8 | 0.1509 |
| S3p_alt_point_20s | illustrative point-source | 20 | 0 | 13,701.2 | 701.3 | 14,385.4 | 0.0520 |

S2 deaths are 54.28% above S1, because α = 0.25 raises PGV. That increase is an **assumed sensitivity**, not a cited duration relation. Official S3 differs from S1 by **0.00%** in expected deaths (4,598.552 vs 4,598.592): a 67 km rupture covers the entire ~41 km NCR portion of the West Valley Fault in both centres, so \(R_{JB}\) barely moves. That is a **finding**, not a bug. The illustrative point-source pair is where a geographic shift is visible (S3p is much lower than S1p, because a point source at the Muntinlupa epicenter leaves more of the dense northern LGUs at large \(R_{JB}\)).

### 3.2 Top LGUs (S1, baseline 20 s, 67 km rupture)

From `results/scenarios/S1_baseline_20s_lgu.csv`. All 17 LGUs, including Pateros, are in the table. Ranked by expected deaths:

| Rank | LGU | 2020 population | Expected deaths | Expected injuries | Deaths per 1,000 |
|---:|---|---:|---:|---:|---:|
| 1 | Quezon City | 2,960,048 | 1,194.7 | 14,536.3 | 0.404 |
| 2 | Taguig City | 886,722 | 565.4 | 6,622.2 | 0.638 |
| 3 | City of Pasig | 803,159 | 457.6 | 5,431.1 | 0.570 |
| 4 | City of Muntinlupa | 543,445 | 339.2 | 3,936.4 | 0.624 |
| 5 | City of Parañaque | 689,992 | 310.6 | 3,734.4 | 0.450 |
| 6 | City of Marikina | 456,059 | 279.5 | 3,247.9 | 0.613 |
| 7 | City of Manila | 1,846,513 | 270.0 | 3,952.6 | 0.146 |
| 8 | City of Makati | 629,616 | 264.4 | 3,466.4 | 0.420 |
| 9 | Caloocan City | 1,661,584 | 248.4 | 3,548.3 | 0.149 |
| 10 | City of Las Piñas | 606,293 | 184.1 | 2,306.9 | 0.304 |
| 11 | City of Mandaluyong | 425,758 | 177.0 | 2,262.3 | 0.416 |
| 12 | Pasay City | 440,656 | 124.2 | 1,632.7 | 0.282 |
| 13 | City of Valenzuela | 714,978 | 56.7 | 980.3 | 0.079 |
| 14 | City of San Juan | 126,347 | 47.8 | 601.9 | 0.378 |
| 15 | **Pateros** | 65,227 | **39.6** | **464.9** | **0.607** |
| 16 | City of Malabon | 380,522 | 26.3 | 479.0 | 0.069 |
| 17 | City of Navotas | 247,543 | 13.2 | 267.5 | 0.053 |

The highest *rates* are along the fault (Taguig 0.638, Muntinlupa 0.624, Marikina 0.613, Pateros 0.607 per 1,000), not always the largest totals. Pateros is small (13 cells, 1.61 km²) but is close to the trace (minimum cell-centre distance 0.041 km). The fault does **not** enter the Pateros polygon (C15); a 500 m cell that overlaps Pateros can still be flagged as fault-crossed because the trace crosses the neighbouring LGU’s share of the same cell.

### 3.3 Sensitivity

- **Duration α** (same S1 rupture, 40 s formula except α = 0 which is the S1 control), mean heavy-damage probability among active cells, from `results/scenarios/duration_alpha_sensitivity.csv`:

  | α | Mean \(P(\mathrm{heavy})\) |
  |---:|---:|
  | 0 (control = S1) | 0.02926 |
  | 0.15 | 0.03802 |
  | 0.25 (official S2) | 0.04496 |
  | 0.40 | 0.05723 |

- **\(V_{S30}\)** on S1, from `results/scenarios/vs30_sensitivity_S1.csv`:

  | \(V_{S30}\) (m/s) | Mean PGV (cm/s) | Mean \(P(\mathrm{heavy})\) |
  |---:|---:|---:|
  | 250 (softer) | 62.14 | 0.03425 |
  | 360 (default, ASSUMED) | 57.95 | 0.02926 |
  | 760 (rock / \(V_\mathrm{ref}\)) | 35.93 | 0.00763 |

  A rock site cuts mean heavy-damage probability to about a quarter of the default.

### 3.4 MMEIRS Model 08 benchmark (not validation)

MMEIRS 2004 Model 08 (JICA/MMDA/PHIVOLCS, Final Report Ch. 2 Table 2.1.2) estimated 33,500 deaths and 113,600 injuries for a **2000** population of 9,932,560 (**3.37 deaths per 1,000**), plus 168,300 heavily damaged residential buildings, and a separate fire-death range that this model does not attempt. This run’s official S1 is **0.341 deaths per 1,000** on a 2020 population of 13,484,462 — about a factor of ten lower as a rate, and 4,598.6 vs 33,500 in count. The inventory, population year, ground-motion method, fragility, and fire module all differ. The comparison belongs in a rates table, not in a “the model is validated” sentence. This model was **not** tuned to match 33,500.

## 4. Checks

`results/all_checks.csv` is the complete list (101 PASS, 0 FAIL, 1 SKIPPED). Unit tests cover UTM (max abs error **4.93×10⁻⁴ m**, limit 0.05 m), a synthetic 3×3 fault-crossing grid (exactly 3 crossings, centre distance 0, 1.00 km rupture), \(P_\mathrm{heavy}(100)=0.0965726316\), and BSSA14 PGV at the test points above. Grid checks C01–C16 include LGU count (17), population conservation (13,484,462), NCR area (~598.73 km²), Pateros presence (13 cells), WVF length (~98.58 km, 108 vertices), epicenters on the trace (baseline in Pasig PH1307403, alternative in Muntinlupa PH1307603), crossed-cell count (100), WVF crossing QC, Marikina, Pasig, Makati, Taguig and Muntinlupa and not Pateros, and neighbour Lipschitz. Scenario checks require non-negative finite casualties, LGU sums equal to cell sums, Pateros present, S2 deaths ≥ S1, and a visible difference between illustrative S1p and S3p. C18 is SKIPPED: the authoritative path is base MATLAB, so groupmates without the Mapping Toolbox can run the same code.

UTM origin, active-cell count, populated-cell count, fault-crossed count and Pateros cell count all matched the independent Python pre-check exactly (2,645 / 2,488 / 100 / 13).

## 5. Limitations

1. **Unvalidated transfers.** Japanese RC-average fragility and RotD50-to-Yamaguchi PGV are the dominant vulnerability and intensity-measure assumptions (ASSUMPTIONS A4, A9).
2. **Housing units ≠ buildings.** PSA counts occupied housing units. Treating them as buildings would be wrong; the model does not.
3. **No structural-material inventory.** There is no 2020 CPH wall-materials table on OpenSTAT; every unit is treated as RC / C1*.
4. **Duration is assumed.** S2 is a sensitivity, not a cited duration-dependent GMPE or fragility. Official S2’s 54% death increase should be read that way.
5. **Official S3 ≈ S1** for a 67 km rupture. A shorter rupture, or a point source (S3p), shows a larger geographic contrast.
6. **Assumed \(V_{S30}\).** One value for the whole of NCR. Reality varies (soft western alluvium vs volcanic highland). Rock vs default changes mean \(P(\mathrm{heavy})\) from 0.029 to 0.008.
7. **GEM GAF is not the PHIVOLCS 1:5,000 atlas.** Trace position has a published-catalogue accuracy, not survey accuracy.
8. **2020 night-time residents.** No 2024 population, no daytime workplace redistribution, no visitors.
9. **Median / expectation only.** No ground-motion residual, no fragility uncertainty, no fatality-rate uncertainty.
10. **No fire, liquefaction, tsunami, landslide, or hospital-function loss.** MMEIRS fire deaths are outside the scope.
11. **Epicenters are assumed points** on the GEM trace, not a forecast.
12. **Collapse rates** are Hazus generic C1* values (13 / 10 / 5 %), not Philippine observational rates.
13. A 1,000 m cell-size sensitivity is recorded in the config but was **not** run in this pass.

## 6. Decision needed: `.cache/modsim-qa`

Branch `step5to9` (Yuan) added `.cache/modsim-qa/` and `docs/RESEARCH.md`. This work starts from that branch, leaves **`.cache/modsim-qa` untouched**, and does not interpret or delete it. Whether that cache should be committed, gitignored, or removed is a decision for the group to take **with Yuan**. It is listed here so it is not forgotten.

## 7. How to reproduce

See `docs/DEMO.md`. From the repository root: `matlab -batch "run_all"`. To rebuild processed NCR extracts from public raw data, see `tools/README.md`.
