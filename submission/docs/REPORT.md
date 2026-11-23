# Grid-Based Earthquake Damage and Casualty Simulation in NCR

**Course:** Modeling and Simulation (CS0019)  
**Members:** Chan Reese, Ebrahim Fathi, Pacate Denienz, and Whitty Juan Angelo Roy

## 1. Objective

This project implements a reproducible MATLAB simulation of earthquake damage and night-time indoor casualties across a simplified 500 m National Capital Region grid. It compares three assumed scenarios:

| Scenario | Epicenter | Shaking duration |
|---|---|---:|
| A | Pasig | 20 seconds |
| B | Pasig | 40 seconds |
| C | Muntinlupa | 40 seconds |

The estimates are conditional model results, not earthquake forecasts.

## 2. Model

The model uses separate ground-motion, damage, and casualty stages:

1. BSSA14 median PGV estimates ground shaking in cm/s.
2. Yamaguchi and Yamazaki RC-average fragility curves estimate heavy-damage probability.
3. FEMA Hazus casualty rates estimate deaths and nonfatal injuries separately.

The grid covers all 17 NCR local government units, including Pateros. PSA 2020 population and occupied-housing data provide exposure. The West Valley Fault supplies fault geometry, and a 67 km rupture representation supplies the primary scenario geometry.

## 3. Results

| Scenario | Heavy-damaged housing units | Expected deaths | Expected nonfatal injuries |
|---|---:|---:|---:|
| A | 91,069.4 | 4,598.6 | 51,480.0 |
| B | 140,421.1 | 7,094.8 | 78,981.8 |
| C | 140,420.0 | 7,094.7 | 78,981.2 |

Scenario A is the baseline. Scenario B retains the Pasig epicenter and applies an assumed 40-second duration treatment. Scenario C moves the epicenter to Muntinlupa while retaining 40 seconds of assumed shaking.

See `../presentation/abc_totals.png` and `../presentation/abc_damage_probability.png`.

## 4. Analysis

Scenario B estimates about 54.28% more deaths than Scenario A. This increase follows the project's assumed duration treatment, not a verified historical relationship between earthquake duration and casualty rates.

Scenarios B and C produce nearly identical NCR totals. Their 67 km rupture representations overlap across much of the West Valley Fault, so moving the assumed epicenter has little regional effect in this model.

The LGU tables show both totals and population-based rates. LGU totals describe potential response scale, while rates provide a separate view of modeled casualty risk.

## 5. Limitations

- The Japanese RC-average fragility relationship is not validated for Philippine buildings.
- FEMA Hazus casualty relationships are transferred to the Philippine context.
- The 20/40-second duration adjustment is assumed.
- Building classes and site conditions are simplified and uniform.
- Fire, liquefaction, landslides, tsunami, rescue delays, and delayed deaths are excluded.
- Residential nighttime population is used; daytime occupancy and visitors are not modeled.

The results are useful for controlled sensitivity comparisons. They should not be presented as an operational earthquake forecast or a validated damage assessment.
