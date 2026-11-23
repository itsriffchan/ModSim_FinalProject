# Region MapLibre OSM 3D — automated checks (2026-11-21)

Agent review only; not human sign-off. **Deviation from [REGION-VIEW.md](../../../view-context/REGION-VIEW.md):** Region uses MapLibre 3D extrusions (probability at footprint centroid per grid cell), saved grid outlines, and the shared locked low camera (62°)—not bird’s-eye/multi-camera toolbar or flat grid wash.

## Environment

- Repo: `ModSim_FinalProject/web`
- Next.js 16.4.6, `maplibre-gl` (OpenFreeMap Liberty style)
- No API token

## Commands

| Command | Result |
| --- | --- |
| `npm test` | 26/26 PASS (includes `buildingDamage`, `osmTiles`, `tileCache`) |
| `npm run build` | PASS |
| `npx playwright test e2e/region-osm3d.spec.ts` | 3/3 PASS |

## Visual checks (agent)

- Compare screenshots in this folder to [design-reference.png](../../../view-context/design-reference.png): accept street-vector (not satellite) context; damage should read on **building extrusions** via blue palette, not flat instanced wash.
- Fault (red) and epicenter marker remain from saved GeoJSON.
- Locked low camera on Region, City, and Compare; no mode toolbar or distance scale bar.
- Style failure → pannable local map with grid/fault/epicenter/LGU overlays.

## Not verified here

- Live OpenFreeMap latency on slow networks (Compare triple canvas measured separately under `20261121_osm_01`).
- Bird’s-eye Region view (intentionally removed per product direction).

## Key files

- `web/components/map/RegionOsm3dMap.tsx`
- `web/lib/basemap/buildingDamage.ts`, `geojsonOverlays.ts`, `maplibreConfig.ts`
- `web/app/region/page.tsx`, `web/app/globals.css`