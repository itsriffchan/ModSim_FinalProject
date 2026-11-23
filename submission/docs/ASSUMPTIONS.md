# Assumptions and sensitivity

Every item below is an assumption, a transfer, or a modelling choice that is **not** identified by the Kobe data or by a cited NCR-specific relation. Each is labelled in the config (`config/modsim_config.json`) and, where a number is produced, in the figure title or table note. AGENTS.md requires this: do not silently treat an assumption as a calibrated fact.

## A1. Site condition \(V_{S30} = 360\) m/s (ASSUMED)

BSSA14 needs a site \(V_{S30}\). No redistributable NCR \(V_{S30}\) raster is in the repository. 360 m/s is the NEHRP C/D boundary, a common default. Batch numerical sensitivity runs A at 250, 360 and 760 m/s, changing only Vs30; the 360 m/s case must reproduce A. Results are saved under `<runRoot>/sensitivity/vs30_sensitivity_A.csv`. These uniform values explore site uncertainty; they are not an NCR site map.

## A2. Duration 20 s → 40 s (ASSUMED)

BSSA14 and Yamaguchi & Yamazaki (2000) have no duration term. Primary B and C use an **assumed sensitivity**:

\[
\mathrm{PGV}_\mathrm{eff} = \mathrm{PGV}\times(T/T_\mathrm{ref})^\alpha,\quad T_\mathrm{ref}=20\,\mathrm{s},\ \alpha=0.25.
\]

Batch runs evaluate B and C separately at α ∈ {0, 0.15, 0.25, 0.40}, fixing Vs30 at 360 m/s. At α = 0, B must reproduce A and C must reproduce an internal same-location 20-second alternative control. That control is saved separately and is not a primary scenario. At α = 0.25 the experiments must reproduce primary B/C. `sensitivity/duration_alpha_sensitivity.csv` reports parameter values, mean PGV/heavy probability, expected damaged housing units, deaths and injuries. A single historical event does not identify a 20-to-40 s duration effect.

## A3. Epicenter locations (ASSUMED)

The West Valley Fault has no unique, published “the” epicenter for a future M 7.2 event. The baseline point is the GEM PHL_31 trace at latitude 14.58°N (Pasig); the alternative is the same trace at 14.40°N (Muntinlupa). Both are required to sit on the trace (tolerance 0.1 km). Official scenarios use a 67 km rupture *centred* on the chosen point, not a point source.

## A4. Japanese RC fragility applied to NCR housing (UNVALIDATED TRANSFER)

Default fragility is Yamaguchi & Yamazaki (2000) **RC average**, for every occupied housing unit. Philippine single houses are typically concrete / CHB, which is the reason this class is preferred over Japanese wood. The curve was fitted to Kobe’s RC inventory and Japanese PGV, not to NCR construction practice, code editions, or maintenance. This is the largest vulnerability assumption in the model.

## A5. Yamaguchi states → Hazus damage states (ASSUMED)

| Yamaguchi (mutually exclusive) | Hazus state used for casualties |
|---|---|
| Heavy | Complete, then split by Table 12-8 collapse-given-complete |
| Moderate-only (\(P_{M+}-P_H\)) | Moderate |
| Below-moderate (\(1-P_{M+}\)) | Zero modeled casualties |

The two NCR fragility curves group undamaged and slightly damaged housing together below the moderate threshold. The casualty estimates therefore cover moderate and heavy damage. The heavy-to-Complete mapping is an assumption. The full-grid zero-shaking control applies 0 cm/s PGV to the same fragility and casualty calculations and checks for zero deaths and injuries in every cell.

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

The 67 km rupture is a contiguous subset of the GEM trace, centred on the scenario epicenter and extended to the target length when one end is hit. It is not a 3-D planar source. \(R_{JB}\) is the horizontal distance to that polyline. Both ruptures overlap across most of the NCR trace, which provides little separation in B/C final losses at equal duration. The batch saves actual C-minus-B differences in `comparison/differences.csv`; no check enforces a particular sign or small difference. Python characterization on committed prepared geometry gives C minus B = −1.049606 heavily damaged housing units, −0.057708 deaths and −0.626782 injuries; these are not executed MATLAB outputs. The epicenter shift also changes assumed arrival times. Legacy illustrative point-source configurations S1p and S3p remain outside primary runs and videos.

## A11. What is not modelled

Fire following earthquake, tsunami, liquefaction, landslides, hospital-function loss, transportation blockage, and aftershocks. MMEIRS attributed a substantial share of deaths in some Model 08 wind cases to fire; those deaths are outside this model’s scope.

## A12. Determinism

The model is median-only (BSSA14 ε = 0; fragility is a mean probability; casualties are expectations). There is no random seed and no Monte Carlo. Repeated scientific arrays must agree; provenance timestamps, paths, and encoder metadata can differ. `run_acceptance` measures public independent versus batch results and hashes other sandbox artifacts, explicitly including every sensitivity artifact. The sensitivity runner repeats all experiments in reversed order, repeats its first case again, and recalculates the primaries to detect state leakage. Checks require finite bounded probabilities, finite nonnegative losses, population/housing conservation, cell/LGU agreement, all 17 LGUs and Pateros; they do not require casualty totals to be monotone across every parameter sweep.

## A13. Casualty timing (ASSUMED)

Each active cell begins at its simplified local S-wave arrival. For duration T and elapsed time t after source origin, f = clip((t - arrival)/T, 0, 1). Animated heavy probability and expected casualties equal f times their final static arrays. This is an assumed linear reveal, not a validated rupture or damage-evolution simulation. Each standalone and comparison counter carries the adjacent label “ASSUMED timing: reveal of final expected totals”. The 20/40 s duration starts after local arrival. Final PGV scaling is applied exactly once before fragility, never during animation.

Scenario `timeline.csv` samples every 0.25 simulated seconds and includes a separately labelled simultaneous-onset casualty control. The normalized shaking illustration is a separate presentation aid and never drives losses. Inactive cells remain masked, distinct from active cells with zero progression. Each video's horizon is ceil(max(local arrival + duration)); the comparison uses the maximum horizon on one source-origin clock. Completed panels retain final map values and casualties.

Default playback is 24 fps, 2 simulated seconds per playback second, followed by 48 held frames (2 playback seconds). Video encoding and playback settings do not alter scientific results. MPEG-4 is preferred; Motion JPEG AVI is tried if its probe or export fails. Numerical results survive codec failures. Every exported frame is decoded for dimensions/count checks; visual acceptance remains a separate review.
