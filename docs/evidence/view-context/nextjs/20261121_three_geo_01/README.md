# three-geo terrain integration — automated checks (2026-11-21)

## Environment

- Repo: `ModSim_FinalProject/web`
- Node: project default via `npm`
- Mapbox token: not set in this run (`NEXT_PUBLIC_MAPBOX_TOKEN` empty)

## Commands

| Command | Result |
| --- | --- |
| `npm test` | 17/17 PASS (utm, warp, coverage, loadTerrain helpers, display, allocation, camera) |
| `npm run build` | PASS (Next.js 16.4.6) |

## Expected runtime (no token)

- Region `/region`: WebGL map, camera toolbar, badge text *Satellite terrain unavailable…*
- City and Compare: same `MapCanvas`; shared terrain cache when token present

## Not run in this session

- Mapbox tile fetch with live token (requires local `.env.local`)
- Compare 30 fps measurement
- Desktop/narrow screenshot diff vs `docs/view-context/design-reference.png`
- Standalone `tools/test_viewer.cjs` (viewer unchanged)

## Files touched

- `web/lib/terrain/*`, `web/lib/map/loadThreeGeo.ts`
- `web/public/vendor/three-geo.min.js`, `three-geo.LICENSE.txt`
- `web/components/map/MapCanvas.tsx`, `HeatmapLayer.ts`, `IllustrativeScenery.tsx`
- `web/components/city/CityView.tsx`, `web/components/compare/*`
- `docs/data_sources.md`, `web/README.md`