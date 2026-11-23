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

- **Region** and **Compare** use the shared **MapLibre** map with OpenFreeMap vector OSM. At close LGU frames, available building footprints show the **saved heavy-damage probability of the grid cell at their centroid**, not a measured building-specific value. The saved grid shows probability fills, inactive and awaiting cells, and arrival edges.
- **City** URLs (`/city/[pcode]`) redirect to Region with that LGU selected. The camera stays north-up at a locked 62° pitch; LGU selection changes the frame, while scroll and pinch zoom are disabled. No Mapbox token or committed tiles are required.
- All map views need a network for tiles at runtime. Offline or blocked tiles keep saved scenario data; missing map context does **not** mean missing damage.
- Attribution is shown in-app (© OpenStreetMap contributors; vector tiles via OpenFreeMap).

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
3. Preserve in-app map attribution and the source register (`docs/data_sources.md`).

## Browser test adapter

`window.modsimExplorer` on `/region` mirrors the standalone `window.modsimViewer` contract (display state only).

## Limitations

- Not an offline `file://` viewer; use [../viewer/README.md](../viewer/README.md).
- City cell/LGU allocation focus needs optional `membership` in exported JSON (re-run `export_scenario_viewer`).
- Region/City/Compare share one locked low camera; no mode toolbar or distance scale bar (this view does not preserve equal screen scale).
- If OpenFreeMap style fails or has no `building` layer, Region keeps a **pannable local map** of grid outlines, fault, epicenter, and LGU lines.
- Compare loads three MapLibre panels. Grid fills and building colors display saved probabilities; they do not recalculate scientific results.
