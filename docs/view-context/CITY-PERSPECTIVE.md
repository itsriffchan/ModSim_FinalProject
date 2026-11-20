# Phase 2: CITY PERSPECTIVE

## Objective and sequencing

Allow selection of any of the 17 LGUs, focus its map and relevant cells, and show its population with separate final casualty summaries. Status: **ready ? REGION VIEW completed 2026-11-20** ([evidence](../evidence/view-context/region-view/20261120_region_01/README.md)); implementation deferred by the approved REGION VIEW scope. Follow [the shared workflow](README.md): prerequisite checks and recorded visual review must pass first. This phase's checks and recorded visual review must pass before COMPARE begins; passing permits continuation without another approval step.

## Verified starting state and data gap

Source inspection confirms that [the payload writer](../../src/write_scenario_viewer.m) exports LGU boundary keys/names and each scenario's authoritative `lgu` rows, including `population_2020`, `expected_deaths` and `expected_injuries`. [The viewer](../../viewer/viewer.js) renders a final LGU table but has no LGU selection/focus state. The exported grid has no cell-to-LGU membership table. A polygon outline does not supply the model's exposure allocation.

[calculate_scenario](../../src/calculate_scenario.m) aggregates casualties by **occupied-housing-unit share within each cell**, using `G.units`. It sums housing rows across classes for each `(cell_id, adm3_pcode)` and divides by all housing units in that cell. For each LGU, it sums the cell's separate deaths/injuries multiplied by that share. It skips nonpositive denominators. `Lg.population_2020` comes from `G.pop.total_population`, not from summing whole focused cells. The nearby population-weighted comment is insufficient: follow the executable housing-share logic.

Saved inputs can be inspected in `prepared/prepared.mat` and `prepared/ncr_cell_lgu_housing.csv`, `prepared/ncr_cell_lgu_population.csv`, and `prepared/ncr_cell_lgu.csv` under the [baseline batch](../../results/runs/viewer_acceptance_20261120/batch/). Housing CSV rows include class/floor fields, so duplicate cell/LGU pairs are expected before grouping. Do not drop those rows as duplicates. Saved scenario `lgu.csv` and `state.mat` supply final totals. Historical [heatmap verification](../VIEWER-VERIFICATION.md) does not verify city focus; city acceptance is pending.

## Required behavior

- Select every LGU by stable `adm3_pcode`, including Pateros (`PH1307606`), with its readable name. Show selected scenario, duration and assumed epicenter. Handle independent A/B/C exports without requiring absent scenarios.
- Focus the selected LGU and relevant intersecting cells with padding, north up and equal projected scale. Identify boundary-crossing cells explicitly and provide a way back to NCR. Preserve overlays, palette, inspection, timing labels and playback.
- Default the summary to the selected scenario's saved final LGU population, expected deaths and expected nonfatal injuries. Label these as final allocated city/LGU totals and retain fractional expectations consistently with the existing viewer. Animated city counters are outside the initial requirement.
- Label focused-map cells separately from allocated city totals. A cell crossing a boundary can appear in more than one focus view. Its whole-cell population or losses must not be presented as belonging entirely to the selected LGU.
- Geometry may determine which cells to show, but cannot determine casualty allocation. Do not use dominant-LGU assignment, cell-center inclusion, clipped area alone or sums of whole selected-cell losses as a substitute for saved housing shares. Preserve population separately from housing and casualties. Missing allocation must be reported, not silently replaced by zeros or invented shares.

## Implementation entry points and future additive fields

Work in [template](../../viewer/template.html), [styles](../../viewer/viewer.css) and [viewer](../../viewer/viewer.js) for selection, focused fit and summary. Extend [payload writer](../../src/write_scenario_viewer.m) and [payload tests](../../tests/verify_viewer_payload.m) only as needed to export saved presentation metadata. Use [calculate_scenario](../../src/calculate_scenario.m) and [numerical checks](../../src/verify_scenario_numerics.m) as allocation references; do not change their scientific relationships.

A future optional schema-1 presentation extension should carry grouped `(cell_id, adm3_pcode)` membership with saved occupied-unit counts and/or their verified housing shares. If geometric focus includes cells with no housing, carry geometric intersection membership separately; absence of housing is not absence of geographic intersection. If population allocation is exposed, derive it from the saved population allocation table and name it separately. Define units, ordering and zero-denominator handling, and verify keys against grid IDs and LGU codes. These are proposed additive fields, **not fields implemented by this documentation task**.

Keep authoritative final summaries in `scenarios.lgu`. Preserve existing fields and `window.modsimViewer` methods/getters listed in [REGION VIEW](REGION-VIEW.md). Any focus controls added to the interface must be additive. Older schema-1 payloads without membership must still render NCR and saved LGU summaries; clearly disable unavailable cell focus rather than fabricate membership. Keep standalone offline packaging, current style, source provenance and saved scientific arrays unchanged.

## Acceptance checks

1. Verify optional allocation data against saved `G.units`: group all housing rows per cell/LGU, check unique grouped keys, finite nonnegative units/shares, valid active-cell IDs and known LGU codes. Shares sum to one for positive-housing cells. Reproduce separate final allocated deaths/injuries within 1e-8 of all 17 saved LGU rows and NCR totals for A/B/C. Check any zero-housing cell's losses explicitly; report inconsistencies instead of altering science.
2. Match city population to authoritative saved LGU population for every LGU and verify the LGU sum matches saved NCR population. Test a multi-LGU boundary cell and Pateros specifically: show shared membership without allocating the full cell to each city. Compare the focus set to saved intersection geometry; selection must not omit a small LGU because it lacks a dominant cell.
3. Test all 17 selections, scenario changes, return to NCR, playback/scrub while focused, cell inspection, resize and reset offline. Confirm city summaries remain final throughout playback and do not become animated NCR counters. Test batch, independent A/B/C and old schema-1 payloads without new fields.
4. Run [shared payload, preservation and offline checks](README.md#verification-procedure-for-later-phases), adding city tests to the existing harness or a focused companion. Rerun REGION VIEW regressions. Record screenshots and visual review of a typical city, a boundary cell, Pateros, NCR return and narrow layout at relevant playback phases.

## Handoff requirements

Record allocation field definitions, saved source paths, key checks, reconciliation tolerances/results, compatibility behavior and screenshot review in new evidence. Record blockers and pending checks explicitly. Follow [the shared handoff record](README.md#handoff-record-required-at-each-gate); only mark CITY PERSPECTIVE complete and COMPARE ready after all checks and recorded visual review pass. Later comparison changes must rerun both completed phases' regressions.
