# Assumptions and sensitivity

Every item below is an assumption, a transfer, or a modelling choice that is **not** identified by the Kobe data or by a cited NCR-specific relation. Each is labelled in the config (`config/modsim_config.json`) and, where a number is produced, in the figure title or table note. AGENTS.md requires this: do not silently treat an assumption as a calibrated fact.

## A1. Site condition \(V_{S30} = 360\) m/s (ASSUMED)

BSSA14 needs a site \(V_{S30}\). No redistributable NCR \(V_{S30}\) raster is in the repository. 360 m/s is the NEHRP C/D boundary, a common default. Sensitivity is reported at 250 m/s (softer, in the direction of western-Manila alluvium) and 760 m/s (BSSA14 \(V_\mathrm{ref}\) / rock). This is a first-order control on PGV and therefore on casualties.

## A2. Duration 20 s → 40 s (ASSUMED)

BSSA14 and Yamaguchi & Yamazaki (2000) have no duration term. Scenario S2 is an **assumed sensitivity**:

\[
\mathrm{PGV}_\mathrm{eff} = \mathrm{PGV}\times(T/T_\mathrm{ref})^\alpha,\quad T_\mathrm{ref}=20\,\mathrm{s},\ \alpha=0.25.
\]

α = 0 is the required control (S2 becomes identical to S1). The run also records mean heavy-damage probability at α ∈ {0, 0.15, 0.25, 0.40}. A single historical event does not identify a 20-to-40 s duration effect.

## A3. Epicenter locations (ASSUMED)

The West Valley Fault has no unique, published “the” epicenter for a future M 7.2 event. The baseline point is the GEM PHL_31 trace at latitude 14.58°N (Pasig); the alternative is the same trace at 14.40°N (Muntinlupa). Both are required to sit on the trace (tolerance 0.1 km). Official scenarios use a 67 km rupture *centred* on the chosen point, not a point source.

## A4. Japanese RC fragility applied to NCR housing (UNVALIDATED TRANSFER)

Default fragility is Yamaguchi & Yamazaki (2000) **RC average**, for every occupied housing unit. Philippine single houses are typically concrete / CHB, which is the reason this class is preferred over Japanese wood. The curve was fitted to Kobe’s RC inventory and Japanese PGV, not to NCR construction practice, code editions, or maintenance. This is the largest vulnerability assumption in the model.

## A5. Yamaguchi states → Hazus damage states (ASSUMED)

| Yamaguchi (mutually exclusive) | Hazus state used for casualties |
|---|---|
| Heavy | Complete, then split by Table 12-8 collapse-given-complete |
| Moderate-only (\(P_{M+}-P_H\)) | Moderate |
| Below-moderate (\(1-P_{M+}\)) | Slight |

Yamaguchi has no “extensive / complete” split, and Hazus has no “heavy”. The crosswalk is a labelling choice, not a published correspondence.

## A6. PSA floor groups → Hazus height classes (ASSUMED)

| PSA floor group | Hazus SBT |
|---|---|
| One, Two, Three Floors; Not Reported; Not applicable | C1L (1–3 storeys) |
| Four Floors; Five to 10 Floors | C1M (mid-rise; the 5–10 bin straddles Hazus mid- and high-rise, mapped to C1M) |
| 11 Floors or more | C1H |

All types, including commercial-industrial-agricultural units that happen to be occupied as housing, use the same RC / C1* path.

## A7. Occupied housing units are not buildings

PSA publishes occupied housing units. The model keeps that unit in every label and does not convert to buildings. Occupants per unit = (PSA household population) / (occupied housing units) in the same LGU, from table `0041A6DTOB0`. Institutional / non-household population is excluded from occupancy, which is why household population (13,388,141) is smaller than the census total (13,484,462).

## A8. Night-time indoor occupancy

Time of day is 2:00 a.m. Indoor fraction is Hazus 6.1 Table 12-2: \(0.999\times0.99=0.98901\) of the night-time residential population is indoors. Outdoor, commuting and workplace occupancy are not modelled. Results are therefore night-time indoor expected values.

## A9. Intensity-measure component

BSSA14 PGV is RotD50 (cm/s). Yamaguchi PGV is a Japanese survey intensity (cm/s). Matching units do not establish component compatibility. This is an unvalidated intensity-measure transfer.

## A10. Finite-rupture geometry

The 67 km rupture is a contiguous subset of the GEM trace, centred on the scenario epicenter and extended to the target length when one end is hit. It is not a 3-D planar source. \(R_{JB}\) is the horizontal distance to that polyline. Because 67 km covers the entire ~41 km NCR portion of the West Valley Fault in **both** epicenter positions, official S3 (alternative 67 km rupture) is expected to be nearly identical to S1. That is a result, not a bug. Illustrative point-source scenarios S1p and S3p ( \(R_{JB}\) = epicentral distance) are provided so a geographic shift can be seen, and are labelled illustrative.

## A11. What is not modelled

Fire following earthquake, tsunami, liquefaction, landslides, hospital-function loss, transportation blockage, and aftershocks. MMEIRS attributed a substantial share of deaths in some Model 08 wind cases to fire; those deaths are outside this model’s scope.

## A12. Determinism

The model is median-only (BSSA14 ε = 0; fragility is a mean probability; casualties are expectations). There is no random seed and no Monte Carlo. Repeating `matlab -batch "run_all"` on the same inputs must reproduce the same CSVs.
