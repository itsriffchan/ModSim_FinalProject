# NCR scenario explorer (Next.js)

Hosted presentation app for saved ModSim scenario payloads (schema 1). Implements **Region**, **City perspectives**, and **Compare** against [../docs/view-context/design-reference.png](../docs/view-context/design-reference.png).

## Setup

```bash
cd web
npm install
npm run sync-data   # junction (local) or copy (CI/Vercel)
```

```bash
npm run dev
```

Open [http://localhost:3000/region](http://localhost:3000/region). Dev component gallery: `/dev/components` (development only).

## Maps and network

- **Region** uses **MapLibre** with OpenFreeMap vector OSM (3D building extrusion). From **zoom 13** (when the OpenFreeMap building layer exists), each building shows the **saved heavy-damage probability of the grid cell at its footprint centroid** (not that building’s own damage). The full NCR frame stays the default; **Show buildings** jumps to the assumed epicenter at zoom 14.5. Saved grid **outlines** show inactive, awaiting, arrived, and arrival-edge states. **Locked low camera** (62°), north-up; pan and zoom only.
- **City** and **Compare** use **Three.js** with warped **OpenStreetMap** raster tiles (`tile.openstreetmap.org`), the same **locked low camera**, and the saved probability heatmap. No Mapbox token and no committed tiles.
- All map views need a network for tiles at runtime. Offline or blocked tiles keep saved scenario data; missing map context does **not** mean missing damage.
- Attribution is shown in-app (© OpenStreetMap contributors; vector credit on Region).

## Data

Presentation JSON is not duplicated locally by default:

| Key | Source |
| --- | --- |
| `comparison` | `results/runs/viewer_acceptance_20261120/batch/comparison/` |
| `A` / `B` / `C` | independent acceptance run folders |

Set `MODSIM_VIEWER_RUN` to point at another run id. Set `MODSIM_COPY_PAYLOADS=1` or deploy on Vercel (`VERCEL=1`) to **copy** payloads into `public/data` for hosting.

## Tests

```bash
npm test              # Vitest (display + allocation + basemap)
npm run build
npm run test:e2e      # Playwright (Edge channel)
```

## Deploy (Vercel)

1. Set project **Root Directory** to `web`.
2. Build command: `npm run build` (runs `prebuild` sync with copy on Vercel).
3. Surface attribution via in-app provenance dialog (`docs/data_sources.md`).

## Browser test adapter

`window.modsimExplorer` on `/region` mirrors the standalone `window.modsimViewer` contract (display state only).

## Limitations

- Not an offline `file://` viewer; use [../viewer/README.md](../viewer/README.md).
- City cell/LGU allocation focus needs optional `membership` in exported JSON (re-run `export_scenario_viewer`).
- Region/City/Compare share one locked low camera; no mode toolbar or distance scale bar (this view does not preserve equal screen scale).
- If OpenFreeMap style fails or has no `building` layer, Region keeps a **pannable local map** of grid outlines, fault, epicenter, and LGU lines.
- Compare loads three raster maps; building damage coloring on Region vector tiles is view-only.