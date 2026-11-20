# Phase 2: CITY PERSPECTIVE

Status: **Next.js implementation complete** — included in [nextjs/20261120_nextjs_01](../evidence/view-context/nextjs/20261120_nextjs_01/README.md). Geographic focus awaits optional `membership` re-export. See [the shared handoff](README.md) and [reference image](design-reference.png). Continue to Compare after the gate passes.

## Target

Implement the pictured City perspectives view: the same application and scenario navigation, a selectable sidebar of all 17 LGUs including Pateros, a city-focused map with the city name and scenario, bird's-eye, oblique, low-angle and orbit controls, a north control, zoom, selected-cell details and an NCR locator. Provide a route back to the regional extent. Make all visible core controls functional, responsive and keyboard accessible. Show final allocated city population, deaths and nonfatal injuries in an accessible summary, clearly labeled as final values even if placed differently from the concept.

The concept's city scene is illustrative: label terrain and buildings accordingly, and never present invented buildings, elevations or whole-cell losses as validated city-specific observations. Geographic boundaries and damage overlays must align with saved geometry. Clearly separate highlighted cells, including boundary-crossing cells, from allocated LGU totals.

## Authoritative allocation and data gap

The current payload contains saved final `scenarios.lgu` rows and LGU boundaries, but no cell-to-LGU membership. [calculate_scenario](../../src/calculate_scenario.m) aggregates casualties by **occupied-housing-unit share within each cell**, using `G.units`: group all housing-class rows by `(cell_id, adm3_pcode)`; divide each grouped count by all housing units in that cell; multiply each cell's separate losses by that share; sum by LGU. It skips nonpositive denominators. Population comes separately from `G.pop.total_population`. Do not use dominant-LGU assignment, cell-center inclusion, clipped area alone, or whole-cell losses as casualty allocation.

Saved inputs include `prepared/prepared.mat`, `ncr_cell_lgu_housing.csv`, `ncr_cell_lgu_population.csv` and `ncr_cell_lgu.csv` in [the baseline batch](../../results/runs/viewer_acceptance_20261120/batch/). Duplicate cell/LGU rows across housing classes are expected before grouping. Add optional schema-1 presentation metadata derived from saved inputs only if needed: grouped housing counts/shares and separate geometric intersection membership, plus separate population allocation if exposed. Define ordering, keys, units and zero-denominator handling. Older payloads without membership must still show NCR and saved final summaries and clearly disable unavailable focus; do not invent membership or silently turn missing data into zero.

## Acceptance

Verify all 17 keys, population totals and final saved deaths/injuries, including Pateros; reproduce housing-share allocations within 1e-8, check share sums and zero-housing cells, and compare focused cells with saved intersection geometry. Test a cell shared by multiple LGUs, each selection, scenario changes, back to NCR, playback, picked-cell inspection, cameras, resize, batch and independent A/B/C and old payloads. Verify final city totals remain unchanged during playback. Re-run REGION VIEW checks and record desktop and narrow visual review against the reference. Document added metadata, provenance and blockers. Mark this phase complete only on fresh passing evidence.
