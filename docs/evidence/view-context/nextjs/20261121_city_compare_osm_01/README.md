# City and Compare on the Region map

Agent check on 2026-11-21. Not a human signoff.

## What was checked

City and Compare use the same MapLibre / OpenFreeMap map as Region. Scroll, pinch, double-click, and box zoom are off. Playback changes the grid fill and does not move the camera. Choosing an LGU is what frames that saved outline. Compare shows A, B, and C side by side with that same rule.

The browser only interpolates saved presentation values. MATLAB outputs were not recalculated.

## Command

From `web/`, against the local Next dev server, Edge via Playwright, one worker:

```text
npx playwright test e2e/region-osm3d.spec.ts e2e/osm-basemap.spec.ts --workers=1
npx playwright test e2e/osm-basemap.spec.ts:29 --workers=1
```

The first command passed every test except the city playback assertion, which was waiting on a full-page capture. The follow-up city test passed after that capture was limited to the map element. Unit checks: `npx vitest run lib/basemap/gridCellFill.test.ts` (4 passed).

## Screenshots

Desktop and narrow captures in this folder: Region at the origin, during playback, and after an LGU zoom; City for Pasig at the origin and during playback, plus Pateros; Compare at the origin, during playback, with a city frame, and on a narrow viewport. OpenStreetMap vector context needs a network; the offline captures record the local fallback.
