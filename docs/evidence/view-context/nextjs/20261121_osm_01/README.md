# OSM raster basemap (City / Compare) — automated checks (2026-11-21)

Region uses MapLibre 3D (`20261121_region_osm3d_01`); this folder is **raster** OSM on Three.js for City and Compare only.

## Environment

- Repo: `ModSim_FinalProject/web`
- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- No Mapbox token

## Commands

| Command | Result |
| --- | --- |
| `npm test` | PASS |
| `npm run build` | PASS |
| `npx playwright test e2e/osm-basemap.spec.ts` | City/Compare/offline city (re-run locally) |
| `npx playwright test e2e/osm-basemap.spec.ts -g compare` | PASS (~2 min, three panels) |

## Key files

- `web/lib/basemap/osmTiles.ts`, `tileCache.ts`, `web/components/map/OsmBasemap.ts`
- `web/components/map/MapCanvas.tsx` (City, Compare)