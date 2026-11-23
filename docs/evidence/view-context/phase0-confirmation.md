# Phase 0 confirmation (2026-11-20)

## Saved payloads

Verified on disk under `results/runs/viewer_acceptance_20261120/`:

| Dataset key | Path |
| --- | --- |
| batch ABC | `batch/comparison/presentation_payload.json` |
| independent A | `independent_2_A/A/presentation_payload.json` |
| independent B | `independent_3_B/B/presentation_payload.json` |
| independent C | `independent_1_C/C/presentation_payload.json` |

Mirror copies may exist under `results/runs/region_view_20261120_region_01/` via `tools/verify_region_view.py`.

## Hosting / redistribution

Model presentation payloads are derived outputs (not raw WorldPop GeoTIFF or COD-AB GDB). Primary inputs committed in-repo use government works (PSA), CC BY-IGO (OCHA), CC BY-SA 4.0 (GEM fault trace), and CC BY 4.0 (WorldPop weights). Hosted deployment must surface attribution via the in-app provenance dialog (from `payload.provenance` and `docs/data_sources.md`). No non-redistributable raw inventory is published in the Next.js static data bundle.

## Review surface

Dev-only route `web/app/dev/components` (excluded from production navigation when `NODE_ENV=production` or via layout guard) renders each component family with real synced payloads for family review before view assembly.