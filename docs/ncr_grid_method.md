# NCR 500 m grid method

MATLAB (`run_ncr_grid.m`) rebuilds the grid from processed CSVs and does **not** take Python’s precomputed cell file as an input. Python (`tools/prep_ncr_inputs.py`) only writes LGU vertices, the fault trace, WorldPop pixel weights, and PSA tables. The two independent constructions are compared through the C01–C16 checks.

## Projection

All geometry is in **EPSG:32651** (WGS 84 / UTM zone 51N). MATLAB uses the Snyder (1987) USGS Professional Paper 1395 series (`src/geo_utm51n_forward.m`). Test vectors against pyproj agree to well under the 0.05 m limit (observed ≤ 0.0005 m).

## Grid alignment

- Cell size: 500 m (a 1,000 m sensitivity is recorded in the config but is not a default run).
- Origin: \(\bigl(\lfloor x_\min/500\rfloor\cdot500,\ \lfloor y_\min/500\rfloor\cdot500\bigr)\) of the NCR-union bounding box. The expected origin from the pre-check is (274500, 1587500); MATLAB prints the origin it actually uses.
- A cell is **active** if its square has positive area overlap with any of the 17 LGU polygons (including Pateros). Expected active count: **2,645** (±1% accepted).
- Multi-LGU cells (pre-check 468) store one row per (cell, LGU) in `ncr_cell_lgu.csv`. Overlap areas must sum to the NCR union area. The dominant LGU of a cell is the one with the largest overlap (ties broken by P-code).

## Population allocation (dasymetric)

1. Each WorldPop 100 m pixel (constrained 2020, R2025A) is assigned to the LGU polygon that contains its centre (`inpolygon` / `assign_wp_owner`).
2. For each LGU, pixel weights are normalised so they sum to one.
3. The **PSA 2020 total population** of that LGU is spread in proportion to those weights, then aggregated to 500 m cells.
4. Conservation: for every LGU, allocated population equals the PSA total within 0.5 persons. The NCR sum is 13,484,462.

WorldPop numbers are **weights**. They are never used as population totals. A pixel-in-polygon difference versus the brief’s pre-check can change the *maximum* cell population (the pre-check was about 33,300; this construction may be higher). Conservation of LGU totals is the acceptance test, not the maximum.

## Housing units

The same WorldPop weights allocate PSA occupied housing units by floor group into `ncr_cell_lgu_housing.csv`, with the assumed Yamaguchi / Hazus class attached. Unit totals must equal 3,257,020.

## Distances

For every active cell centre:

- `dist_fault_km` — minimum distance to the full GEM WVF polyline.
- `dist_epi_baseline_km`, `dist_epi_alt_km` — Euclidean distances to the two assumed epicenters.
- `rjb_s1_km`, `rjb_s3_km` — distance to the 67 km rupture segment centred on the baseline or alternative epicenter. This is the \(R_{JB}\) used by official S1/S2 and S3.

Because each epicenter is on the trace, `dist_fault` ≤ `dist_epi` + 0.001 km (a 1 m slack covers rounding of the published lon/lat, which sit a few decimetres off the vertices). Neighbour Lipschitz: the absolute difference of a distance field between 4-adjacent active cells is at most one cell size (0.5 km).

## Fault crossings

A cell is fault-crossed if any WVF segment intersects the closed cell rectangle (Liang-Barsky, `geom_segment_rect_intersect`). Expected count: 100 (accepted 90–110). The trace is expected to intersect Quezon City, Marikina, Pasig, Makati, Taguig and Muntinlupa, and **not** Pateros.

## Implementation notes (base MATLAB only)

Polygons are `polyshape` objects. Point assignment uses `inpolygon` (vectorised), not Mapping Toolbox `projfwd` or `geoshape`. Figures use `Visible` off and `exportgraphics` at 200 dpi, with `YDir` normal (north up) and `axis equal`. Inactive cells are left blank.
