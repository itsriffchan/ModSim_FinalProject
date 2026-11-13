# Data sources

This file lists every source used for steps 5–17. Raw files that are too large, or whose licence forbids redistribution, are **not** in the repository; see `tools/README.md` for how to re-download them. Processed extracts that *are* committed are attributed here. Nothing in this project is a fabricated figure.

Dates below that carry a `Z` or an explicit offset are converted to Asia/Singapore (UTC+8) when they are discussed in the report.

## 1. Kobe 1995 reference (already in the repository; cleaned in this branch)

| Item | Source | What we use | Notes |
|---|---|---|---|
| Ward population | City of Kobe 1990 census extracts (`data/raw/*.xls` on `main`, 1990-10-01) | Nine wards, 1,477,410 persons. Written to `data/processed/kobe_ward_population.csv`. | AGENTS.md: this is the **1990-10-01 census**, not the 1995 present population. Male + female equals total for every ward. |
| Ward outcomes | City of Kobe “Higai” pages, https://www.city.kobe.lg.jp/a21572/bosai/shobo/hanshinawaji/higai2.html | Deaths 4,571 (reported 2005-12-22); injuries 14,678 (reported 2000-01-11); full-damage buildings 67,421 and partial-damage 55,145 (both 1995-12-22). Written to `data/processed/kobe_ward_outcomes.csv`. | Different reporting dates; they are **not** a single consistent snapshot. No `**Total**` rows — totals are computed by summing the nine wards. |
| Fragility coefficients | Yamaguchi & Yamazaki (2000), 12WCEE paper 2451, Tables 3 and 4. PDF: https://www.iitk.ac.in/nicee/wcee/article/2451.pdf | `data/processed/fragility_parameters.csv`: PGV (cm/s) lognormal λ, ζ for wood, WP, RC, steel, LSP; heavy and heavy+moderate; construction-period splits. Default model uses **RC average**: heavy λ = 5.71, ζ = 0.849; heavy+moderate λ = 5.11, ζ = 0.798. | Equation (1): \(P = \Phi((\ln(\mathrm{PGV})-\lambda)/\zeta)\). MATLAB `log` is ln. Implementation check: \(P_\mathrm{heavy}(100\,\mathrm{cm/s}) = 0.0965726\). |

The previous `data/processed/fragility_parameters.csv` on `main` actually held ward population, and `kobe_ward_population.csv` was an empty blob. This branch puts population, outcomes and coefficients in the files their names describe. Descriptive Kobe rates (3.0939 deaths and 9.9349 injuries per 1,000 1990-census residents) are **event summaries**, not NCR casualty coefficients.

## 2. NCR exposure and geography

| ID | Source | What we use | Licence / citation | In the repo? |
|---|---|---|---|---|
| S1 | **PSA 2020 Census of Population and Housing**, OpenSTAT table `0011A6DPHH0`, reference date 2020-05-01 (proclaimed official by Proc. No. 1179, 2021-07-06). API: https://openstat.psa.gov.ph/PXWeb/api/v1/en/DB/1A/PO_2020/0011A6DPHH0.px | Total population, household population and households for all **17** NCR LGUs, including Pateros. NCR sum is **13,484,462**. | Philippine government statistics; RA 8293 §176 (government works). Cite “Philippine Statistics Authority, 2020 CPH”. | Yes: `data/raw/psa/psa_2020cph_ncr_openstat.csv` and `data/processed/ncr_lgu_population_2020.csv`. |
| S2 | **OCHA HDX COD-AB Philippines** (`cod-ab-phl`), source NAMRIA + PSA, version v03, `valid_on` 2025-02-13. Dataset: https://data.humdata.org/dataset/cod-ab-phl | Admin-3 polygons for the 17 NCR LGUs (P-codes `PH13…`). FileGDB zip sha256 `e7fc18f1383a21066ecfbe595c5c1d77375c93341dedf7284f09d66dbd28c5ad`. NCR union area **598.7264 km²** (EPSG:32651); Pateros **1.6097 km²**; Quezon City **162.4846 km²**. Caloocan and Las Piñas have two parts; no holes. | **CC BY-IGO**. Attribute NAMRIA / PSA / OCHA. | Raw GDB is **not** committed (360 MB). Processed vertex CSV and attributes are: `ncr_lgu_boundaries_vertices.csv`, `ncr_lgu_attributes.csv`. |
| S3 | **GEM Global Active Faults** (GEM GAF), West Valley Fault `catalog_id = PHL_31`, commit `56816508ad92fd6846dad1163b1c8c01376a2cd1`. sha256 `37babb516edfac22b5ae91744495d8546b3ae4676b4d4f68cc77da8222df20e1`. | 108 vertices, UTM length **98.582 km**. Used as the rupture trace. East Valley Fault is extracted only for context (`evf_trace_vertices.csv`) and is **not** a source in the model. | **CC BY-SA 4.0**. https://github.com/GEMScienceTools/gem-global-active-faults | Raw geojson is **not** committed. Processed: `wvf_trace_vertices.csv` + `wvf_trace_vertices.LICENSE.txt`. |
| S4 | **WorldPop Global2 R2025A**, 2020 constrained 100 m, Philippines. doi: [10.5258/SOTON/WP00839](https://doi.org/10.5258/SOTON/WP00839). File `phl_pop_2020_CN_100m_R2025A_v1.tif`, sha256 `6a98ec3e2b9389535d2b9d9708fb9f5700aabf2a34f5a7fbc093dbc32724cac2`. | **Relative weights only.** LGU *totals* always come from PSA. 67,649 pixels fall inside NCR LGU polygons. | **CC BY 4.0**. WorldPop (University of Southampton and collaborators). | Raw GeoTIFF is **not** committed (63 MB). Processed: `ncr_worldpop2020_pixels.csv`. |
| S5 | **PSA 2020 CPH occupied housing units by type of building**, OpenSTAT `0041A6DTOB0`. | 3,257,020 occupied housing units and 13,388,141 household population across the 17 LGUs, by building type. These are **housing units, not buildings**. | Same as S1. | Yes: raw + `ncr_lgu_housing_type_2020.csv`. |
| S6 | **PSA 2020 CPH occupied housing units by number of floors**, OpenSTAT `0051A6DBNF0`. | Floor groups (1, 2, 3, 4, 5–10, 11+, Not Reported, Not applicable), same 3,257,020 unit total. Used with the assumed Hazus height crosswalk. | Same as S1. | Yes: raw + `ncr_lgu_housing_floors_2020.csv`. |

The earlier draft brief listed table IDs `0031A6DTOB0` and `0041A6DBNF0`; those URLs 404. The working IDs are `0041A6DTOB0` and `0051A6DBNF0`. There is no 2020 CPH wall-materials table on OpenSTAT’s PO_2020 list, so structural-material mapping cannot be data-driven.

### Vintage traps (do not mix)

- Use **2020 CPH + COD-AB v03** together. Do not attach 2024 POPCEN totals to 2020 boundaries.
- EMBO barangays moved from Makati to Taguig in 2023; 2020 CPH still reflects the 2020 assignment.
- PSA’s published land area for Pateros is 10.40 km²; the COD-AB polygon is **1.61 km²**. The model uses the polygon.
- GEM GAF is not the PHIVOLCS 1:5,000 Valley Fault System Atlas. PHIVOLCS atlases are used only as a visual LGU-list check (QC, Marikina, Pasig, Makati, Taguig, Muntinlupa; not Pateros).

## 3. Ground motion, damage and casualties

| Item | Source | What we use | Notes |
|---|---|---|---|
| BSSA14 | Boore, Stewart, Seyhan, Atkinson (2014), *Earthquake Spectra* 30(3), 1057–1085, doi:10.1193/070113EQS184M. Coefficients from the electronic supplement as implemented in OpenQuake `boore_2014.py` (`CoeffsTable`, base, no regional Dc3). | Median RotD50 **PGV in cm/s**, strike-slip (`e1`), \(M_\mathrm{ref}=4.5\), \(R_\mathrm{ref}=1\), \(V_\mathrm{ref}=760\). \(R=\sqrt{R_{JB}^2+h^2}\). Philippines is not a listed regional adjustment; **Dc3 = 0**. | Site \(V_{S30}\) is **ASSUMED 360 m/s** (NEHRP C/D), with sensitivity at 250 and 760. Implementation checks: \(M_w=7.2\), \(V_{S30}=360\): PGV(\(R_{JB}=0\)) = 77.1128 cm/s, PGV(\(R_{JB}=10\)) = 41.7464 cm/s. BSSA14 PGV is RotD50; Yamaguchi PGV is a Japanese survey intensity — units match, component convention is an **unvalidated transfer**. |
| Magnitude and rupture length | JICA / MMDA / PHIVOLCS, **MMEIRS 2004**, Final Report Chapter 2 Table 2.1.2, Model 08. | \(M_w=7.2\), strike-slip, 67 km length, 21 km width, dip 90°, top depth 2 km. | Model 08 also estimated 33,500 deaths, 113,600 injuries, 168,300 heavily damaged residential buildings for a **2000** population of 9,932,560. These are a **benchmark, not a validation target and not a model input**. |
| Hazus indoor casualty rates | FEMA, *Hazus 6.1 Earthquake Model Technical Manual*, July 2024, Section 12, Tables 12-3 to 12-8. Official PDF at fema.gov returned HTTP 403 from this environment; the file was retrieved from the Internet Archive snapshot of the same 6.1 manual (13.7 MB, 477 pages, July 2024). | Indoor rates (percent of occupants) for C1L / C1M / C1H, plus Table 12-8 collapse-given-complete (C1L 13%, C1M 10%, C1H 5%). Night-time indoor fraction: Table 12-2, \(0.999\times0.99=0.98901\). Written to `hazus61_indoor_casualty_rates.csv` and `hazus61_collapse_rates.csv`. | Damage-state crosswalk from Yamaguchi to Hazus is **ASSUMED** (see `docs/ASSUMPTIONS.md`). Fire, tsunami and liquefaction are not modelled. |
| Building-class crosswalk | Constructed for this project, labelled **ASSUMED**. | All PSA housing types → Yamaguchi RC average. Floors 1–3 and Not Reported / Not applicable → Hazus C1L; 4 and 5–10 → C1M; 11+ → C1H. | Philippine single houses are typically concrete / CHB, not Japanese wood. The transfer is unvalidated. |

## 4. Coordinate reference and epicenters

- Projected CRS: **EPSG:32651** (WGS 84 / UTM zone 51N). Forward projection in MATLAB is the Snyder (1987) USGS PP 1395 series, checked against pyproj to ≤ 0.05 m (observed error ≤ 0.0005 m on the test vectors).
- Baseline epicenter (ASSUMED): 121.07011°E, 14.58000°N, on the GEM trace in Pasig.
- Alternative epicenter (ASSUMED): 121.04696°E, 14.40000°N, on the GEM trace in Muntinlupa, about 20.07 km south.
- Both points are required to lie within 0.1 km of the trace.

## 5. Retrieval dates

Processed NCR extracts were built on **13 November 2026** (see `data/processed/MANIFEST_ncr_inputs.json` for SHA-256 hashes and library versions). PSA OpenSTAT tables were retrieved the same day. GEM GAF is pinned to the commit above. WorldPop is the R2025A v1 GeoTIFF whose hash is recorded in the manifest.

## 6. What is intentionally not used

- 2024 POPCEN / CPH (different vintage from COD-AB v03).
- PHIVOLCS FaultFinder vectors or hand-digitised atlas traces.
- MMEIRS building-by-building inventory (not redistributable; figures used only as a published benchmark).
- JMA Kobe accelerograms (`data/raw/jma_kobe/`, gitignored). Optional for `inspect_jma_kobe.m`; not required for `run_all`.
- A Philippines \(V_{S30}\) map — none was obtained as a redistributable raster. Geomate (2022) reported some LGU averages (e.g. Manila 206.48 m/s, Quezon City 554.08 m/s) but a complete 17-LGU table was not extracted, so those values are **not** used.
