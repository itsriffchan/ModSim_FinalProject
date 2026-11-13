# NCR input preparation

MATLAB does not need this folder to run. `run_all` reads only the processed CSVs already in `data/processed/`. Use this script if you need to **rebuild** those CSVs from the public raw products, or to verify hashes.

## What the script does

`prep_ncr_inputs.py` downloads (or reuses) four public products, clips them to NCR, projects them to EPSG:32651, and writes analysis-ready CSVs:

- PSA 2020 CPH (OpenSTAT tables `0011A6DPHH0`, `0041A6DTOB0`, `0051A6DBNF0`)
- OCHA COD-AB FileGDB (NAMRIA/PSA, CC BY-IGO)
- GEM Global Active Faults, `catalog_id=PHL_31` (CC BY-SA 4.0)
- WorldPop Global2 R2025A 2020 constrained 100 m (CC BY 4.0, doi:10.5258/SOTON/WP00839)

It asserts LGU counts, the NCR population total 13,484,462, WVF vertex count and length, and SHA-256 hashes recorded in `data/processed/MANIFEST_ncr_inputs.json`. It does not invent values; a missing raw file in `--offline` mode is a hard error.

## Setup

```text
python -m pip install -r tools/requirements-prep.txt
```

The FileGDB is read with `pyogrio` (OpenFileGDB). GDAL’s Python `osgeo` module is not required.

## Run

From the repository root, with a network connection:

```text
python tools/prep_ncr_inputs.py --repo-root .
```

If the raw files are already in `data/raw/`:

```text
python tools/prep_ncr_inputs.py --repo-root . --offline
```

## Raw files that are not in git

`.gitignore` excludes the large raw downloads:

| Path | Approximate size | SHA-256 (first 16 hex) |
|---|---|---|
| `data/raw/cod_ab/phl_admin_boundaries.gdb.zip` | 360 MB | `e7fc18f1383a2106` |
| `data/raw/worldpop/phl_pop_2020_CN_100m_R2025A_v1.tif` | 63 MB | `6a98ec3e2b938953` |
| `data/raw/gem/gem_active_faults_harmonized.geojson` | (GEM GAF dump) | `37babb516edfac22` |

PSA CSVs in `data/raw/psa/` are small and may be committed. Processed NCR extracts (vertices, pixel weights, LGU tables) are committed and are sufficient to run MATLAB. Do not commit PHIVOLCS atlas PDFs, FaultFinder screenshots, or the MMEIRS report.

Licence reminders: COD-AB is CC BY-IGO (attribute NAMRIA/PSA/OCHA); GEM is CC BY-SA 4.0; WorldPop is CC BY 4.0. WorldPop pixel values are **relative weights**, never population totals.
